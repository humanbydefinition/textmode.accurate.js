import { unregisterConversionStrategy as c, registerConversionStrategy as f } from "textmode.js";
const a = "accurate";
let e = null;
const A = { id: a, createShader() {
  if (!e) throw Error("[textmode.accurate.js] Accurate shader not initialized. Was the plugin installed correctly?");
  return e;
}, createUniforms({ source: t, font: o, gridWidth: i, gridHeight: n }) {
  const r = t.createBaseConversionUniforms();
  return Object.assign(r, { U0: o.fontFramebuffer, U1: [o.textureColumns, o.textureRows], U2: [i, n], U3: o.fontSize }), r;
} }, l = () => ({ name: "textmode-accurate-conversion", version: "1.0.0", async install(t) {
  e = await t.createFilterShader(`#version 300 es
precision highp float;in vec2 v_uv;uniform sampler2D U4;uniform sampler2D U0;uniform bool U5;uniform bool U6;uniform bool U7;uniform float U8;uniform bool U9;uniform vec4 Ua;uniform bool Ub;uniform vec4 Uc;uniform vec4 Ud;uniform int Ue;uniform vec3 Uf[255];uniform vec2 U2;uniform ivec2 U1;uniform int U3;uniform bool Ug;uniform int Uh;uniform vec4 Ui[64];layout(location=0)out vec4 o_character;layout(location=1)out vec4 o_primaryColor;layout(location=2)out vec4 o_secondaryColor;const float A=0.01;const int B=16;const int C=255;const int D=B*B;float E(vec3 F){return dot(F,vec3(0.299,0.587,0.114));}int G(vec3 H){int I=int(H.r*255.+0.5);int J=int(H.g*255.+0.5);return I+(J<<8);}vec2 K(int L){float M=float(L&255)/255.;float N=float((L>>8)&255)/255.;return vec2(M,N);}float O(vec3 P,vec3 Q){vec3 R=P-Q;return dot(R,R);}vec4 S(vec4 T){if(!Ug||Uh<=0){return T;}int U=min(Uh,64);vec3 V=Ui[0].rgb;float W=O(T.rgb,V);for(int X=1;X<64;++X){if(X>=U){break;}vec3 Y=Ui[X].rgb;float Z=O(T.rgb,Y);if(Z<W){W=Z;V=Y;}}return vec4(V,T.a);}void main(){vec2 a=max(U2,vec2(1.));vec2 b=vec2(v_uv.x,1.-v_uv.y);vec2 c=floor(clamp(b,0.,1.)*a);vec2 d=c/a;vec2 e=(c+1.)/a;vec2 f=e-d;int g=clamp(U3,1,B);float h=1./float(g);int i=g*g;float j[D];vec3 k[D];float l[D];float m[D];float n=0.;vec4 o;vec2 p=(d+e)*0.5;o=texture(U4,p);o=S(o);for(int q=0;q<B;++q){if(q>=g){break;}for(int r=0;r<B;++r){if(r>=g){break;}int s=q*g+r;vec2 t=(vec2(float(r),float(q))+0.5)*h;vec2 u=d+t*f;vec4 v=texture(U4,u);v=S(v);float w=E(v.rgb);j[s]=w;k[s]=v.rgb;l[s]=v.a;n+=w;}}float x=i>0?n/float(i):0.;vec3 y=vec3(0.);vec3 z=vec3(0.);float AA=0.;float AB=0.;bool AC=false;for(int X=0;X<D;++X){if(X>=i){break;}float AD=l[X];if(AD>A){AC=true;}float AE=j[X]>=x?1.:0.;m[X]=AE;float AF=max(AD,0.0001);if(AE>0.5){y+=k[X]*AF;AA+=AF;}else{z+=k[X]*AF;AB+=AF;}}vec4 AG=vec4(AA>0.?y/AA:o.rgb,1.);vec4 AH=vec4(AB>0.?z/AB:o.rgb,1.);vec4 AI=U9?Ua:AG;vec4 AJ=Ub?Uc:AH;vec2 AK=vec2(max(U1.x,1),max(U1.y,1));vec2 AL=1./AK;vec2 AM=Ue>0?Uf[0].xy:K(0);vec2 AN=AM;float AO=1.0e20;if(Ue>0){int AP=int(min(float(Ue),float(C)));for(int AQ=0;AQ<C;++AQ){if(AQ>=AP){break;}vec3 AR=Uf[AQ];int AS=G(AR);int AT=AS/max(U1.x,1);int AU=AS-AT*max(U1.x,1);AT=clamp(AT,0,max(U1.y-1,0));AU=clamp(AU,0,max(U1.x-1,0));float AV=float(U1.y-1-AT);vec2 AW=vec2(float(AU),AV)*AL;float AX=0.;for(int q=0;q<B;++q){if(q>=g){break;}for(int r=0;r<B;++r){if(r>=g){break;}int s=q*g+r;vec2 t=(vec2(float(r),float(q))+0.5)*h;vec2 AY=AW+t*AL;float AZ=texture(U0,AY).r;float R=m[s]-AZ;AX+=R*R;}}float Aa=AX/float(i);if(Aa<AO){AO=Aa;AN=AR.xy;}}}if(!AC){AN=(Ue>0)?Uf[0].xy:K(0);AI=Ud;AJ=Ud;}int Ab=int(U5?1:0);int Ac=int(U6?1:0);int Ad=int(U7?1:0);float Ae=float(Ab|(Ac<<1)|(Ad<<2))/255.;o_character=vec4(AN,Ae,clamp(U8,0.,1.));o_primaryColor=vec4(AI.rgb,AI.a);o_secondaryColor=vec4(AJ.rgb,AJ.a);}`), f(A);
}, async uninstall() {
  c(a), e && (e.o(), e = null);
} });
typeof window < "u" && (window.createTextmodeAccurateConversionPlugin = l);
export {
  l as createAccurateConversionPlugin
};
