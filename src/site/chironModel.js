import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const ASSET_BASE = import.meta.env.BASE_URL;
const CHIRON_MODEL_URL = `${ASSET_BASE}models/chiron.glb`;
const DRACO_DECODER_PATH = `${ASSET_BASE}draco/`; // three's glTF Draco decoder, served from public/

// Decoded once and shared by every viewer. The cached geometry and materials must not be
// disposed or edited in place; clone materials before changing them.
let chironModelPromise = null;
export function loadChironModel() {
  if (!chironModelPromise) {
    const dracoLoader = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    chironModelPromise = loader.loadAsync(CHIRON_MODEL_URL).finally(() => dracoLoader.dispose());
    chironModelPromise.catch(() => { chironModelPromise = null; });
  }
  return chironModelPromise;
}
