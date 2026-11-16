// Puts a scene filmed outside film.mjs (such as assistant-scene.json) into a take's plan.json.
//   node add-scene.mjs <take-folder> <scene.json> <before-scene>
import fs from 'node:fs';
import path from 'node:path';
const [, , dir, file, before] = process.argv;
const planFile = path.join(dir, 'plan.json');
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const { name, caption, beats } = JSON.parse(fs.readFileSync(file, 'utf8'));
plan.scenes = plan.scenes.filter((s) => s.name !== name);
const at = plan.scenes.findIndex((s) => s.name === before);
plan.scenes.splice(at < 0 ? plan.scenes.length : at, 0, { name, caption, beats });
fs.writeFileSync(planFile, JSON.stringify(plan, null, 1));
console.log(plan.scenes.map((s) => s.name).join(', '));
