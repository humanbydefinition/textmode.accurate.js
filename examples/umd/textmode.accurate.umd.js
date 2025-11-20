var r,n;r=this,n=function(a,t){const i="accurate";let e=null;const u={id:i,createShader:()=>e,createUniforms({source:l,font:o,gridWidth:f,gridHeight:m}){const s=l.createBaseConversionUniforms();return Object.assign(s,{u_characterTexture:o.fontFramebuffer,u_charsetDimensions:[o.textureColumns,o.textureRows],u_imageCellDimensions:[f,m],u_sampleGridSize:o.fontSize}),s}},c=()=>({name:"textmode.accurate",version:"1.0.0",async install(l){e=await l.createFilterShader(`#version 300 es\r
precision highp float;\r
\r
in vec2 v_uv;\r
\r
// Base uniforms filled in by textmode.js\r
uniform sampler2D u_image;\r
uniform bool u_invert;\r
uniform bool u_flipX;\r
uniform bool u_flipY;\r
uniform float u_charRotation;\r
uniform bool u_charColorFixed;\r
uniform vec4 u_charColor;\r
uniform bool u_cellColorFixed;\r
uniform vec4 u_cellColor;\r
uniform vec4 u_backgroundColor;\r
uniform int u_charCount;\r
uniform vec3 u_charList[255];\r
uniform bool u_colorFilterEnabled;\r
uniform int u_colorFilterSize;\r
uniform vec4 u_colorFilterPalette[64];\r
\r
// Uniforms specific to accurate conversion\r
uniform sampler2D u_characterTexture;\r
uniform ivec2 u_charsetDimensions;\r
uniform vec2 u_imageCellDimensions;\r
uniform int u_sampleGridSize;\r
\r
layout(location = 0) out vec4 o_character;\r
layout(location = 1) out vec4 o_primaryColor;\r
layout(location = 2) out vec4 o_secondaryColor;\r
\r
const float ALPHA_EPSILON = 0.01;\r
const int MAX_SAMPLE_STEPS = 16;\r
const int MAX_CHARACTERS = 255;\r
const int MAX_GRID_SAMPLES = MAX_SAMPLE_STEPS * MAX_SAMPLE_STEPS;\r
\r
float luminance(vec3 c) {\r
    return dot(c, vec3(0.299, 0.587, 0.114));\r
}\r
\r
int decodeCharIndex(vec3 encoded) {\r
    int low = int(encoded.r * 255.0 + 0.5);\r
    int high = int(encoded.g * 255.0 + 0.5);\r
    return low + (high << 8);\r
}\r
\r
vec2 encodeCharIndex(int index) {\r
    float lower = float(index & 255) / 255.0;\r
    float upper = float((index >> 8) & 255) / 255.0;\r
    return vec2(lower, upper);\r
}\r
\r
float colorDistance(vec3 a, vec3 b) {\r
    vec3 diff = a - b;\r
    return dot(diff, diff);\r
}\r
\r
vec4 applyColorFilter(vec4 color) {\r
    if (!u_colorFilterEnabled || u_colorFilterSize <= 0) {\r
        return color;\r
    }\r
\r
    int paletteCount = min(u_colorFilterSize, 64);\r
    vec3 best = u_colorFilterPalette[0].rgb;\r
    float minDist = colorDistance(color.rgb, best);\r
\r
    for (int i = 1; i < 64; ++i) {\r
        if (i >= paletteCount) {\r
            break;\r
        }\r
        vec3 candidate = u_colorFilterPalette[i].rgb;\r
        float dist = colorDistance(color.rgb, candidate);\r
        if (dist < minDist) {\r
            minDist = dist;\r
            best = candidate;\r
        }\r
    }\r
\r
    return vec4(best, color.a);\r
}\r
\r
void main() {\r
    vec2 cellCounts = max(u_imageCellDimensions, vec2(1.0));\r
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);\r
    vec2 cellIndex = floor(clamp(uv, 0.0, 1.0) * cellCounts);\r
    vec2 cellMin = cellIndex / cellCounts;\r
    vec2 cellMax = (cellIndex + 1.0) / cellCounts;\r
    vec2 cellSize = cellMax - cellMin;\r
\r
    int steps = clamp(u_sampleGridSize, 1, MAX_SAMPLE_STEPS);\r
    float invSteps = 1.0 / float(steps);\r
    int sampleCount = steps * steps;\r
\r
    float brightnessSamples[MAX_GRID_SAMPLES];\r
    vec3 colorSamples[MAX_GRID_SAMPLES];\r
    float alphaSamples[MAX_GRID_SAMPLES];\r
    float splitMask[MAX_GRID_SAMPLES];\r
\r
    float brightnessSum = 0.0;\r
    vec4 fallbackSample;\r
    vec2 centerUV = (cellMin + cellMax) * 0.5;\r
    fallbackSample = texture(u_image, centerUV);\r
    fallbackSample = applyColorFilter(fallbackSample);\r
\r
    for (int sy = 0; sy < MAX_SAMPLE_STEPS; ++sy) {\r
        if (sy >= steps) {\r
            break;\r
        }\r
        for (int sx = 0; sx < MAX_SAMPLE_STEPS; ++sx) {\r
            if (sx >= steps) {\r
                break;\r
            }\r
\r
            int idx = sy * steps + sx;\r
            vec2 offset = (vec2(float(sx), float(sy)) + 0.5) * invSteps;\r
            vec2 sampleCoord = cellMin + offset * cellSize;\r
            vec4 sampleColor = texture(u_image, sampleCoord);\r
            sampleColor = applyColorFilter(sampleColor);\r
            float lum = luminance(sampleColor.rgb);\r
\r
            brightnessSamples[idx] = lum;\r
            colorSamples[idx] = sampleColor.rgb;\r
            alphaSamples[idx] = sampleColor.a;\r
            brightnessSum += lum;\r
        }\r
    }\r
\r
    float avgBrightness = sampleCount > 0 ? brightnessSum / float(sampleCount) : 0.0;\r
\r
    vec3 primaryAccum = vec3(0.0);\r
    vec3 secondaryAccum = vec3(0.0);\r
    float primaryWeight = 0.0;\r
    float secondaryWeight = 0.0;\r
    bool hasOpaqueSample = false;\r
\r
    for (int i = 0; i < MAX_GRID_SAMPLES; ++i) {\r
        if (i >= sampleCount) {\r
            break;\r
        }\r
\r
        float alpha = alphaSamples[i];\r
        if (alpha > ALPHA_EPSILON) {\r
            hasOpaqueSample = true;\r
        }\r
\r
        float mask = brightnessSamples[i] >= avgBrightness ? 1.0 : 0.0;\r
        splitMask[i] = mask;\r
\r
        float weight = max(alpha, 0.0001);\r
        if (mask > 0.5) {\r
            primaryAccum += colorSamples[i] * weight;\r
            primaryWeight += weight;\r
        } else {\r
            secondaryAccum += colorSamples[i] * weight;\r
            secondaryWeight += weight;\r
        }\r
    }\r
\r
    vec4 sampledPrimary = vec4(primaryWeight > 0.0 ? primaryAccum / primaryWeight : fallbackSample.rgb, 1.0);\r
    vec4 sampledSecondary = vec4(secondaryWeight > 0.0 ? secondaryAccum / secondaryWeight : fallbackSample.rgb, 1.0);\r
\r
    vec4 charCol = u_charColorFixed ? u_charColor : sampledPrimary;\r
    vec4 cellCol = u_cellColorFixed ? u_cellColor : sampledSecondary;\r
\r
    vec2 glyphCounts = vec2(max(u_charsetDimensions.x, 1), max(u_charsetDimensions.y, 1));\r
    vec2 glyphCellSize = 1.0 / glyphCounts;\r
\r
    vec2 defaultEncoded = u_charCount > 0 ? u_charList[0].xy : encodeCharIndex(0);\r
    vec2 bestEncoded = defaultEncoded;\r
    float bestError = 1.0e20;\r
\r
    if (u_charCount > 0) {\r
        int clampedCharCount = int(min(float(u_charCount), float(MAX_CHARACTERS)));\r
        for (int charIdx = 0; charIdx < MAX_CHARACTERS; ++charIdx) {\r
            if (charIdx >= clampedCharCount) {\r
                break;\r
            }\r
\r
            vec3 paletteColor = u_charList[charIdx];\r
            int glyphIndex = decodeCharIndex(paletteColor);\r
\r
            int glyphRow = glyphIndex / max(u_charsetDimensions.x, 1);\r
            int glyphCol = glyphIndex - glyphRow * max(u_charsetDimensions.x, 1);\r
            glyphRow = clamp(glyphRow, 0, max(u_charsetDimensions.y - 1, 0));\r
            glyphCol = clamp(glyphCol, 0, max(u_charsetDimensions.x - 1, 0));\r
\r
            float flippedRow = float(u_charsetDimensions.y - 1 - glyphRow);\r
            vec2 glyphMin = vec2(float(glyphCol), flippedRow) * glyphCellSize;\r
\r
            float error = 0.0;\r
            for (int sy = 0; sy < MAX_SAMPLE_STEPS; ++sy) {\r
                if (sy >= steps) {\r
                    break;\r
                }\r
                for (int sx = 0; sx < MAX_SAMPLE_STEPS; ++sx) {\r
                    if (sx >= steps) {\r
                        break;\r
                    }\r
\r
                    int idx = sy * steps + sx;\r
                    vec2 offset = (vec2(float(sx), float(sy)) + 0.5) * invSteps;\r
                    vec2 glyphUV = glyphMin + offset * glyphCellSize;\r
                    float glyphLum = texture(u_characterTexture, glyphUV).r;\r
                    float diff = splitMask[idx] - glyphLum;\r
                    error += diff * diff;\r
                }\r
            }\r
\r
            float normalizedError = error / float(sampleCount);\r
            if (normalizedError < bestError) {\r
                bestError = normalizedError;\r
                bestEncoded = paletteColor.xy;\r
            }\r
        }\r
    }\r
\r
    if (!hasOpaqueSample) {\r
        bestEncoded = (u_charCount > 0) ? u_charList[0].xy : encodeCharIndex(0);\r
        charCol = u_backgroundColor;\r
        cellCol = u_backgroundColor;\r
    }\r
\r
    int invertFlag = int(u_invert ? 1 : 0);\r
    int flipXFlag = int(u_flipX ? 1 : 0);\r
    int flipYFlag = int(u_flipY ? 1 : 0);\r
    float packedFlags = float(invertFlag | (flipXFlag << 1) | (flipYFlag << 2)) / 255.0;\r
\r
    o_character = vec4(bestEncoded, packedFlags, clamp(u_charRotation, 0.0, 1.0));\r
    o_primaryColor = vec4(charCol.rgb, charCol.a);\r
    o_secondaryColor = vec4(cellCol.rgb, cellCol.a);\r
}\r
`),t.registerConversionStrategy(u)},async uninstall(){t.unregisterConversionStrategy(i),e&&(e.dispose(),e=null)}});typeof window<"u"&&(window.createAccurateConversionPlugin=c),a.createAccurateConversionPlugin=c,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})},typeof exports=="object"&&typeof module<"u"?n(exports,require("textmode.js")):typeof define=="function"&&define.amd?define(["exports","textmode.js"],n):n((r=typeof globalThis<"u"?globalThis:r||self).textmodeAccurate={},r.textmode);
