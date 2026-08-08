#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_worldPosition;

// Base uniforms filled in by textmode.js
uniform sampler2D u_image;
uniform bool u_invert;
uniform bool u_flipX;
uniform bool u_flipY;
uniform float u_charRotation;
uniform bool u_charColorFixed;
uniform vec4 u_charColor;
uniform bool u_cellColorFixed;
uniform vec4 u_cellColor;
uniform vec4 u_backgroundColor;
uniform int u_charCount;
uniform sampler2D u_charPaletteTexture;
uniform ivec2 u_charPaletteDimensions;

// Uniforms specific to accurate conversion
uniform sampler2D u_characterTexture;
uniform ivec2 u_charsetDimensions;
uniform vec2 u_imageCellDimensions;
uniform int u_sampleGridSize;
uniform float u_accurateBrightnessStart;
uniform float u_accurateBrightnessEnd;

layout(location = 0) out vec4 o_character;
layout(location = 1) out vec4 o_primaryColor;
layout(location = 2) out vec4 o_secondaryColor;
layout(location = 3) out vec4 o_statePayload;

// Keep accurate conversion aligned with textmode.js' source-conversion lighting contract.
uniform bool u_tmUseLighting;
uniform vec3 u_tmAmbientLightColor;
uniform int u_tmPointLightCount;
uniform vec3 u_tmPointLightPositions[5];
uniform vec3 u_tmPointLightColors[5];
uniform vec3 u_tmLightFalloff;

const float ALPHA_EPSILON = 0.01;
const int MAX_SAMPLE_STEPS = 16;
const int MAX_GRID_SAMPLES = MAX_SAMPLE_STEPS * MAX_SAMPLE_STEPS;
const int TM_MAX_POINT_LIGHTS = 5;

float luminance(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

int decodeCharIndex(vec3 encoded) {
    int low = int(encoded.r * 255.0 + 0.5);
    int high = int(encoded.g * 255.0 + 0.5);
    return low + (high << 8);
}

vec2 encodeCharIndex(int index) {
    float lower = float(index & 255) / 255.0;
    float upper = float((index >> 8) & 255) / 255.0;
    return vec2(lower, upper);
}

vec3 fetchCharPaletteColor(int index) {
    int columns = max(u_charPaletteDimensions.x, 1);
    int y = index / columns;
    int x = index % columns;
    return texelFetch(u_charPaletteTexture, ivec2(x, y), 0).rgb;
}

vec3 tmComputeGeometricNormal(vec3 worldPosition) {
    vec3 normal = cross(dFdy(worldPosition), dFdx(worldPosition));
    float normalLength = length(normal);
    if (normalLength <= 0.000001f) {
        return vec3(0.0f, 0.0f, 1.0f);
    }
    return normal / normalLength;
}

vec3 tmApplyLighting(vec3 baseColor, vec3 worldPosition) {
    if (!u_tmUseLighting) {
        return baseColor;
    }

    vec3 litColor = baseColor * u_tmAmbientLightColor;

    if (u_tmPointLightCount > 0) {
        vec3 normal = tmComputeGeometricNormal(worldPosition);

        for (int i = 0; i < TM_MAX_POINT_LIGHTS; ++i) {
            if (i >= u_tmPointLightCount) {
                break;
            }

            vec3 toLight = u_tmPointLightPositions[i] - worldPosition;
            float distanceToLight = length(toLight);
            vec3 lightDirection = distanceToLight > 0.000001f ? toLight / distanceToLight : normal;
            float diffuse = max(dot(normal, lightDirection), 0.0f);

            float attenuationDenominator =
                u_tmLightFalloff.x + distanceToLight * u_tmLightFalloff.y + distanceToLight * distanceToLight * u_tmLightFalloff.z;
            float attenuation = attenuationDenominator > 0.0f ? 1.0f / attenuationDenominator : 1.0f;
            litColor += baseColor * u_tmPointLightColors[i] * (diffuse * attenuation);
        }
    }

    return clamp(litColor, 0.0f, 1.0f);
}

void main() {
    vec2 cellCounts = max(u_imageCellDimensions, vec2(1.0));
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 cellIndex = floor(clamp(uv, 0.0, 1.0) * cellCounts);
    vec2 cellMin = cellIndex / cellCounts;
    vec2 cellMax = (cellIndex + 1.0) / cellCounts;
    vec2 cellSize = cellMax - cellMin;

    int steps = clamp(u_sampleGridSize, 1, MAX_SAMPLE_STEPS);
    float invSteps = 1.0 / float(steps);
    int sampleCount = steps * steps;
    float splitMask[MAX_GRID_SAMPLES];

    float brightnessSum = 0.0;
    vec4 fallbackSample;
    vec2 centerUV = (cellMin + cellMax) * 0.5;
    fallbackSample = texture(u_image, centerUV);

    for (int sy = 0; sy < MAX_SAMPLE_STEPS; ++sy) {
        if (sy >= steps) {
            break;
        }
        for (int sx = 0; sx < MAX_SAMPLE_STEPS; ++sx) {
            if (sx >= steps) {
                break;
            }

            vec2 offset = (vec2(float(sx), float(sy)) + 0.5) * invSteps;
            vec2 sampleCoord = cellMin + offset * cellSize;
            vec4 sampleColor = texture(u_image, sampleCoord);
            float lum = luminance(sampleColor.rgb);

            brightnessSum += lum;
        }
    }

    float avgBrightness = sampleCount > 0 ? brightnessSum / float(sampleCount) : 0.0;
    if (avgBrightness < u_accurateBrightnessStart || avgBrightness > u_accurateBrightnessEnd) {
        discard;
    }
    vec3 primaryAccum = vec3(0.0);
    vec3 secondaryAccum = vec3(0.0);
    float primaryWeight = 0.0;
    float secondaryWeight = 0.0;
    bool hasOpaqueSample = false;

    for (int sy = 0; sy < MAX_SAMPLE_STEPS; ++sy) {
        if (sy >= steps) {
            break;
        }
        for (int sx = 0; sx < MAX_SAMPLE_STEPS; ++sx) {
            if (sx >= steps) {
                break;
            }

            vec2 offset = (vec2(float(sx), float(sy)) + 0.5) * invSteps;
            vec2 sampleCoord = cellMin + offset * cellSize;
            vec4 sampleColor = texture(u_image, sampleCoord);
            int idx = sy * steps + sx;
            float alpha = sampleColor.a;
            if (alpha > ALPHA_EPSILON) {
                hasOpaqueSample = true;
            }

            float mask = luminance(sampleColor.rgb) >= avgBrightness ? 1.0 : 0.0;
            splitMask[idx] = mask;
            float weight = max(alpha, 0.0001);
            if (mask > 0.5) {
                primaryAccum += sampleColor.rgb * weight;
                primaryWeight += weight;
            } else {
                secondaryAccum += sampleColor.rgb * weight;
                secondaryWeight += weight;
            }
        }
    }

    vec4 sampledPrimary = vec4(primaryWeight > 0.0 ? primaryAccum / primaryWeight : fallbackSample.rgb, 1.0);
    vec4 sampledSecondary = vec4(secondaryWeight > 0.0 ? secondaryAccum / secondaryWeight : fallbackSample.rgb, 1.0);

    vec4 charCol = u_charColorFixed ? u_charColor : sampledPrimary;
    vec4 cellCol = u_cellColorFixed ? u_cellColor : sampledSecondary;

    vec2 glyphCounts = vec2(max(u_charsetDimensions.x, 1), max(u_charsetDimensions.y, 1));
    vec2 glyphCellSize = 1.0 / glyphCounts;

    vec2 defaultEncoded = u_charCount > 0 ? fetchCharPaletteColor(0).xy : encodeCharIndex(0);
    vec2 bestEncoded = defaultEncoded;
    float bestError = 1.0e20;

    if (u_charCount > 0) {
        for (int charIdx = 0; charIdx < u_charCount; ++charIdx) {
            vec3 paletteColor = fetchCharPaletteColor(charIdx);
            int glyphIndex = decodeCharIndex(paletteColor);

            int glyphRow = glyphIndex / max(u_charsetDimensions.x, 1);
            int glyphCol = glyphIndex - glyphRow * max(u_charsetDimensions.x, 1);
            glyphRow = clamp(glyphRow, 0, max(u_charsetDimensions.y - 1, 0));
            glyphCol = clamp(glyphCol, 0, max(u_charsetDimensions.x - 1, 0));

            float flippedRow = float(u_charsetDimensions.y - 1 - glyphRow);
            vec2 glyphMin = vec2(float(glyphCol), flippedRow) * glyphCellSize;

            float error = 0.0;
            for (int sy = 0; sy < MAX_SAMPLE_STEPS; ++sy) {
                if (sy >= steps) {
                    break;
                }
                for (int sx = 0; sx < MAX_SAMPLE_STEPS; ++sx) {
                    if (sx >= steps) {
                        break;
                    }

                    vec2 offset = (vec2(float(sx), float(sy)) + 0.5) * invSteps;
                    int idx = sy * steps + sx;
                    vec2 glyphUV = glyphMin + offset * glyphCellSize;
                    float glyphLum = texture(u_characterTexture, glyphUV).r;
                    float diff = splitMask[idx] - glyphLum;
                    error += diff * diff;
                }
            }

            float normalizedError = error / float(sampleCount);
            if (normalizedError < bestError) {
                bestError = normalizedError;
                bestEncoded = paletteColor.xy;
            }
        }
    }

    if (!hasOpaqueSample) {
        bestEncoded = (u_charCount > 0) ? fetchCharPaletteColor(0).xy : encodeCharIndex(0);
        charCol = u_backgroundColor;
        cellCol = u_backgroundColor;
    }

    int invertFlag = int(u_invert ? 1 : 0);
    int flipXFlag = int(u_flipX ? 1 : 0);
    int flipYFlag = int(u_flipY ? 1 : 0);
    float packedFlags = float(invertFlag | (flipXFlag << 1) | (flipYFlag << 2)) / 255.0;

    o_character = vec4(bestEncoded, packedFlags, clamp(u_charRotation, 0.0, 1.0));
    o_primaryColor = vec4(tmApplyLighting(charCol.rgb, v_worldPosition), charCol.a);
    o_secondaryColor = vec4(tmApplyLighting(cellCol.rgb, v_worldPosition), cellCol.a);
    o_statePayload = vec4(0.0);
}
