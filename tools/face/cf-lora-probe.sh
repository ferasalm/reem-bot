#!/usr/bin/env bash
# Owner 2026-10-13 (Step C): "revert cloudflare to Klein 4B, and try to use the following LoRAs with it": Klein Anatomy Quality Fixer
# (Civitai version 2617474, Klein 4B, rank 4, 11 MB) and Ultra Real Amateur Selfies (version 2666766, Klein 4B, rank 32, 88 MB), both
# BFL-named. Cloudflare's LoRA docs list only text models and klein 9B refused finetunes (run 38330056690); this asks klein 4B itself.
# Run by .github/workflows/cf-lora-probe.yml on a push of this file (never on dev/main). Prints every answer; pictures go to out/.
# Cost: six klein 4B pictures at 576x1024 (~104 neurons each, inside the free 10,000 a day).
set -u
M="@cf/black-forest-labs/flux-2-klein-4b"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai"
AUTH="Authorization: Bearer $CLOUDFLARE_API_TOKEN"
# Civitai's signed links (24 h), as LESSONS says: Actions has no Civitai key
ANATOMY_URL="https://b2.civitai.com/file/civitai-modelfiles/model/2224185/klein4bSliderAnatomy.avhC.safetensors?Authorization=3_20261013014654_716b332ae6454188b7a3d7dd_047889c1efc7da64cf60d737bdc1e48ed1326afc_004_20261013024654_0051_dnld&b2ContentDisposition=attachment%3B+filename%3D%22klein4B_slider_anatomy.safetensors%22"
SELFIE_URL="https://b2.civitai.com/file/civitai-modelfiles/model/6638906/amateurSelfie4b.eHLO.safetensors?Authorization=3_20261013014655_c9b313d4f8ad778147b7e32c_6233cbb662047c759304aadb77c34649e1bbcdb3_004_20261013024655_0046_dnld&b2ContentDisposition=attachment%3B+filename%3D%22amateur_selfie_4b.safetensors%22"
mkdir -p out
fetch() { # dir, url, rank
  mkdir -p "$1"; curl -sS -L -o "$1/adapter_model.safetensors" "$2"; ls -la "$1"
  printf '{"peft_type": "LORA", "r": %s, "lora_alpha": %s, "base_model_name_or_path": "black-forest-labs/FLUX.2-klein-4B", "model_type": "flux2", "target_modules": ["qkv", "proj", "img_mlp.0", "img_mlp.2", "txt_mlp.0", "txt_mlp.2", "linear1", "linear2"]}\n' "$3" "$3" > "$1/adapter_config.json"
}
echo "== download"; fetch anatomy "$ANATOMY_URL" 4; fetch selfie "$SELFIE_URL" 32
draw() { # name, extra form args...
  local name="$1"; shift
  echo "== draw $name"
  local t0=$(date +%s)
  curl -sS -D "out/$name.h" -o "out/$name.json" -w "HTTP %{http_code}\n" -H "$AUTH" -F "prompt=Realistic candid smartphone photo of a 29-year-old woman with dark wavy hair in a messy bun, a gray knit cardigan over a black tank top, sitting on a worn olive sofa by a window, one of her hands resting on her knee, soft window light." -F width=576 -F height=1024 -F seed=4242 "$@" "$API/run/$M"
  echo "seconds $(($(date +%s)-t0)) neurons $(grep -i cf-ai-neurons "out/$name.h" | tr -d '\r')"
  python3 - "$name" <<'P'
import json, sys, base64, hashlib
n = sys.argv[1]
d = json.load(open(f"out/{n}.json"))
img = (d.get("result") or {}).get("image")
if img:
    b = base64.b64decode(img); open(f"out/{n}.jpg", "wb").write(b)
    print("image bytes", len(b), "sha", hashlib.sha256(b).hexdigest()[:16])
else:
    print("answer", json.dumps(d)[:600])
P
}
draw plain
draw bogus-lora -F "lora=no-such-lora-xyz"
echo "== finetune list"; curl -sS -H "$AUTH" "$API/finetunes" | head -c 1500; echo
for f in anatomy selfie; do
  echo "== finetune create $f (wrangler)"
  (cd "$f" && npx --yes wrangler@4.145.0 ai finetune create "$M" "reem-$f-4b" . 2>&1 | tail -30)
done
echo "== finetune create (REST)"
curl -sS -H "$AUTH" -H "Content-Type: application/json" -d "{\"model\":\"$M\",\"name\":\"reem-anatomy-4b-rest\",\"description\":\"Anatomy fixer probe\"}" "$API/finetunes" | head -c 1500; echo
echo "== finetune list after"; curl -sS -H "$AUTH" "$API/finetunes" | head -c 3000; echo
draw lora-anatomy -F "lora=reem-anatomy-4b"
draw lora-selfie -F "lora=reem-selfie-4b"
draw loras-json -F 'loras=[{"name":"reem-selfie-4b","weight":1}]'
echo "== done"
