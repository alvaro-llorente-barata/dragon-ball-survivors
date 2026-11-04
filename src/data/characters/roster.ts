import type { CharacterDef, SpriteSpec } from '../types';
import { alienSprite, armorSprite, form, giSprite, makeChar as C } from './builder';

// Colores reutilizados
const BK = '#1b1b24';
const GD = '#ffe14d';
const GD2 = '#fff27a';
const OR = '#f07a1a';
const BL = '#2a4fb8';
const NAVY = '#1d2a5a';
const WH = '#f0f0f0';
const NAMEK = '#5fb84a';
const PURPLE = '#6a3aa8';
const PINK = '#f29ac8';
const RED = '#c62828';
const SKIN = '#f2c49b';

// ---------- Sprites base de personajes que tienen varias versiones ----------
const gokuGi = (hair: string, style: SpriteSpec['hairStyle'] = 'spiky', extra: Partial<SpriteSpec> = {}) => giSprite(OR, BL, hair, style, extra);
const vegetaSuit = (hair: string, extra: Partial<SpriteSpec> = {}) => armorSprite('#2a3a8a', '#f0e8c0', hair, 'vegeta', { gi: '#2a3a8a', ...extra });
const gohanGi = (hair: string, extra: Partial<SpriteSpec> = {}) => giSprite('#6a3aa8', RED, hair, 'gohan', { belt: RED, ...extra });
const piccoloSp = (extra: Partial<SpriteSpec> = {}) =>
  alienSprite(NAMEK, PURPLE, PURPLE, 'turban', WH, { antenna: '#3f8a30', cape: WH, belt: '#4ab8e8', boots: '#8a4a2a', build: 'normal', ...extra });
const freezerSp = (extra: Partial<SpriteSpec> = {}) =>
  alienSprite('#f0eef5', '#f0eef5', '#f0eef5', 'dome', '#8a4ab8', { horns: BK, tail: '#f0eef5', eye: '#c81a3a', ...extra });
const cellSp = (extra: Partial<SpriteSpec> = {}) =>
  alienSprite('#4fb04a', '#3a8a3a', BK, 'crest', '#2a6a2a', { eye: '#ff4ad0', tail: '#3a8a3a', mark: BK, ...extra });
const buuSp = (skin = PINK, extra: Partial<SpriteSpec> = {}) =>
  alienSprite(skin, '#2a2a3a', WH, 'buu', skin, { belt: '#ffd84a', boots: '#ffd84a', cape: '#5a2a8a', mark: 'M', ...extra });
const trunksSp = (hair = '#b8a0e0', extra: Partial<SpriteSpec> = {}) =>
  giSprite('#3a3a4a', '#e8d84a', hair, 'bowl', { gi: '#2a2a3a', pants: '#3a4a6a', boots: '#e8d84a', sword: true, ...extra });
const brolySp = (hair = BK, extra: Partial<SpriteSpec> = {}) =>
  giSprite('#f0e0b0', '#d4a020', hair, 'wild', { gi: '#e8b8a0', skin: '#e8b88a', pants: '#f0f0e0', belt: RED, boots: '#d4a020', build: 'bulky', earring: GD, ...extra });
const saiyanArmor = (hair: string, style: SpriteSpec['hairStyle'], extra: Partial<SpriteSpec> = {}) =>
  armorSprite(NAVY, '#e8e0c8', hair, style, { tail: '#5a3418', ...extra });
const freezaSoldier = (skin: string, hair: string, style: SpriteSpec['hairStyle'], extra: Partial<SpriteSpec> = {}) =>
  armorSprite('#2a2440', WH, hair, style, { skin, ...extra });

const KAME = ['kamehameha', 'rapid_punch', 'ki_blast', 'kiai'];
const SAIYAN = ['galick_gun', 'big_bang', 'saiyan_rush', 'ki_blast', 'homing_ki'];

// ===================== DRAGON BALL CLÁSICO =====================
const CLASSIC: CharacterDef[] = [
  C('goku_kid', 'Goku niño', 'dragonball', 2, 'speedster', 'power_pole', ['power_pole', 'rapid_punch', 'kamehameha', 'kiai', 'ki_blast'], 'kamehameha_x10', giSprite('#3a6ac8', '#d84a2a', BK, 'spiky', { tail: '#5a3418', gi: '#3a6ac8', pants: '#3a6ac8', giAccent: '#f0d040', belt: '#f0d040' }), {
    family: 'goku',
    size: 0.82,
    desc: 'El pequeño Goku con su Báculo Sagrado. Puede convertirse en Ozaru con la luna llena.',
    forms: [form('ozaru', 'Ozaru', 14, 80, 6, 2.1, 0xff4a4a, { skin: '#7a4a2a', hair: '#5a3418', hairStyle: 'long', gi: '#6a3e22', pants: '#6a3e22', eye: '#ff2a2a', build: 'bulky' }, { size: 2.2, speedMul: 0.75, defenseMul: 1.8 })],
  }),
  C('goku_ozaru_kid', 'Goku niño Ozaru', 'dragonball', 4, 'giant', 'kiai', ['kiai', 'power_impact', 'gigantic_roar', 'rapid_punch', 'ki_blast'], 'planet_burst', alienSprite('#7a4a2a', '#6a3e22', '#6a3e22', 'long', '#5a3418', { eye: '#ff2a2a', tail: '#5a3418', build: 'bulky' }), { family: 'goku', size: 2, desc: 'Un mono gigante sin control. Destroza todo lo que toca.' }),
  C('krillin_kid', 'Krilin niño', 'dragonball', 1, 'balanced', 'ki_blast', ['ki_blast', 'rapid_punch', 'solar_flare', 'kiai', 'kamehameha'], 'kamehameha_x10', giSprite(OR, BL, SKIN, 'bald', { mark: '#3a3a3a' }), { family: 'krillin', size: 0.78 }),
  C('yamcha', 'Yamcha', 'dragonball', 1, 'brawler', 'wolf_fang', ['wolf_fang', 'spirit_ball', 'rapid_punch', 'ki_blast', 'kiai'], 'kamehameha_x10', giSprite(OR, BL, BK, 'long'), { desc: 'Ex bandido del desierto. Puños de lobo y el Sokidan.' }),
  C('tien', 'Ten Shin Han', 'dragonball', 2, 'blaster', 'tri_beam', ['tri_beam', 'solar_flare', 'dodonpa', 'rapid_punch', 'ki_blast'], 'planet_burst', giSprite('#3a8a3a', '#f0e0a0', SKIN, 'bald', { gi: '#f0f0f0', pants: '#3a8a3a', mark: RED }), { desc: 'Tres ojos. Kikoho brutal y Taiyoken para cegar.' }),
  C('chaozu', 'Chaoz', 'dragonball', 1, 'support', 'telekinesis', ['telekinesis', 'dodonpa', 'ki_blast', 'kiai', 'homing_ki'], 'planet_burst', giSprite('#f0e0c0', RED, '#f0f0f0', 'bald', { skin: '#f0f0f0', mark: '#e86a8a' }), { size: 0.72, desc: 'Pequeño pero poderoso con la mente. Paraliza a los enemigos.' }),
  C('roshi', 'Maestro Roshi', 'dragonball', 2, 'balanced', 'kamehameha', [...KAME, 'solar_flare'], 'kamehameha_x10', giSprite('#f0d8a0', '#c86a2a', SKIN, 'bald', { gi: '#f0d8a0', beard: WH, mustache: WH }), { desc: 'El inventor del Kamehameha. Lento pero sabio.', stat: { speed: 0.9, ki: 1.2 } }),
  C('jackie_chun', 'Jackie Chun', 'dragonball', 3, 'speedster', 'rapid_punch', [...KAME, 'solar_flare'], 'kamehameha_x10', giSprite('#3a6a3a', '#d8c060', WH, 'spiky', { beard: WH }), { desc: 'Roshi disfrazado. Golpes rápidos y engaños.' }),
  C('tao_pai_pai', 'Tao Pai Pai', 'dragonball', 2, 'sniper', 'dodonpa', ['dodonpa', 'rapid_punch', 'ki_blast', 'homing_ki', 'kiai'], 'planet_burst', giSprite('#e8e0c8', RED, BK, 'flat', { pants: '#e8e0c8' }), { desc: 'El asesino más famoso. Dodonpa letal.' }),
  C('general_blue', 'General Blue', 'dragonball', 1, 'brawler', 'rapid_punch', ['rapid_punch', 'telekinesis', 'ki_blast', 'kiai', 'wolf_fang'], 'planet_burst', armorSprite('#2a5ab8', '#2a5ab8', '#f0d84a', 'flat', { boots: BK }), { family: 'red_ribbon' }),
  C('general_white', 'General White', 'dragonball', 1, 'tank', 'kiai', ['kiai', 'rapid_punch', 'ki_blast', 'power_impact', 'homing_ki'], 'planet_burst', armorSprite('#e8e8e8', '#c8c8c8', '#5a3a1a', 'flat', { boots: BK }), { family: 'red_ribbon' }),
  C('android_8', 'Androide 8', 'dragonball', 2, 'tank', 'power_impact', ['power_impact', 'rapid_punch', 'kiai', 'ki_barrier', 'ki_blast'], 'planet_burst', alienSprite('#a8d88a', '#4a6a3a', '#3a4a2a', 'bald', '#a8d88a', { build: 'bulky', mark: '#5a5a5a' }), { size: 1.25, desc: 'Hachan, el androide bondadoso. Enorme y fuerte.' }),
  C('grandpa_gohan', 'Abuelo Gohan', 'dragonball', 2, 'balanced', 'power_pole', ['power_pole', 'rapid_punch', 'kiai', 'ki_blast', 'kamehameha'], 'kamehameha_x10', giSprite('#3a8a5a', '#d8b860', '#d8d8d8', 'bald', { beard: '#d8d8d8' }), { family: 'gohan_old' }),
  C('piccolo_daimao', 'Piccolo Daimaoh', 'dragonball', 4, 'blaster', 'demon_wave', ['demon_wave', 'telekinesis', 'hellzone', 'ki_blast', 'kiai'], 'planet_burst', piccoloSp({ hairStyle: 'bald', cape: undefined, gi: '#3a3a6a', beard: undefined }), { family: 'piccolo', passive: 'regeneration', size: 1.1 }),
  C('piccolo_jr', 'Piccolo Jr.', 'dragonball', 3, 'blaster', 'hellzone', ['hellzone', 'demon_wave', 'makankosappo', 'ki_blast', 'rapid_punch'], 'special_beam', piccoloSp(), { family: 'piccolo', passive: 'regeneration' }),
  C('tambourine', 'Tambourine', 'dragonball', 1, 'speedster', 'rapid_punch', ['rapid_punch', 'ki_blast', 'wolf_fang', 'kiai', 'homing_ki'], 'planet_burst', alienSprite('#7ab85a', '#3a5a2a', '#3a5a2a', 'bald', '#7ab85a', { antenna: '#5a8a3a', cape: undefined }), { family: 'demon' }),
  C('cymbal', 'Cymbal', 'dragonball', 1, 'brawler', 'absorb', ['absorb', 'rapid_punch', 'ki_blast', 'kiai', 'saiyan_rush'], 'planet_burst', alienSprite('#5a9a3a', '#3a5a2a', '#3a5a2a', 'bald', '#5a9a3a', { horns: '#3a5a2a' }), { family: 'demon' }),
  C('drum', 'Drum', 'dragonball', 1, 'tank', 'power_impact', ['power_impact', 'rapid_punch', 'kiai', 'absorb', 'ki_blast'], 'planet_burst', alienSprite('#4a8a3a', '#3a5a2a', '#3a5a2a', 'bald', '#4a8a3a', { build: 'bulky' }), { family: 'demon', size: 1.2 }),
  C('arale', 'Arale', 'dragonball', 3, 'glass', 'power_impact', ['power_impact', 'kiai', 'rapid_punch', 'ki_blast', 'big_bang'], 'planet_burst', giSprite('#e84a6a', '#4a8ad8', '#5a2a8a', 'bob', { gi: '#e8a0b8', pants: '#4a8ad8', mark: '#ffffff' }), { size: 0.8, desc: '¡N-cha! Una robot con una fuerza absurda.' }),
];

// ===================== SAGA SAIYAN =====================
const SAIYAN_SAGA: CharacterDef[] = [
  C('gohan_kid', 'Gohan niño', 'saiyan', 2, 'blaster', 'masenko', ['masenko', 'ki_blast', 'kamehameha', 'kiai', 'homing_ki'], 'kamehameha_x10', giSprite('#6a3aa8', RED, BK, 'gohan', { tail: '#5a3418' }), { family: 'gohan', size: 0.75, passive: 'crit_master', desc: 'Poder oculto enorme: los críticos son devastadores.' }),
  C('piccolo', 'Piccolo', 'saiyan', 3, 'tank', 'makankosappo', ['makankosappo', 'hellzone', 'demon_wave', 'ki_blast', 'rapid_punch'], 'special_beam', piccoloSp(), { passive: 'regeneration', desc: 'Resistente, regenera vida y perfora con el Makankosappo.' }),
  C('krillin', 'Krilin', 'saiyan', 2, 'balanced', 'destructo_disc', ['destructo_disc', 'solar_flare', 'kamehameha', 'ki_blast', 'rapid_punch'], 'kamehameha_x10', giSprite(OR, BL, SKIN, 'bald', { mark: '#3a3a3a' }), { desc: 'El mejor amigo de Goku. Kienzan y Taiyoken.' }),
  C('yajirobe', 'Yajirobe', 'saiyan', 1, 'swordsman', 'sword_slash', ['sword_slash', 'rapid_punch', 'kiai', 'ki_blast', 'wolf_fang'], 'planet_burst', giSprite('#8a6a3a', '#5a3a2a', BK, 'flat', { build: 'bulky', sword: true }), { size: 0.9, desc: 'Samurái glotón. Corta la cola de los Ozaru.' }),
  C('raditz', 'Raditz', 'saiyan', 3, 'brawler', 'saiyan_rush', SAIYAN, 'planet_burst', saiyanArmor(BK, 'long'), { passive: 'saiyan_blood' }),
  C('nappa', 'Nappa', 'saiyan', 3, 'tank', 'power_impact', ['power_impact', 'saiyan_rush', 'ki_blast', 'big_bang', 'kiai'], 'planet_burst', saiyanArmor(BK, 'bald', { mustache: BK, build: 'bulky' }), { size: 1.25, desc: 'El enorme general Saiyan. Golpes y explosiones bucales.' }),
  C('vegeta', 'Vegeta', 'saiyan', 4, 'glass', 'galick_gun', [...SAIYAN, 'kiai'], 'final_flash', vegetaSuit(BK), {
    desc: 'El príncipe Saiyan. Mucho daño, poca defensa. Se transforma en partida.',
    forms: [
      form('ssj', 'Super Saiyan', 10, 55, 3.2, 1.6, 0xffd84a, { hair: GD, eye: '#1fa58f' }),
      form('ssj2', 'Super Saiyan 2', 18, 70, 4.5, 2, 0xfff27a, { hair: GD2, eye: '#17c7a8' }, { lightning: true }),
      form('majin', 'Majin Vegeta', 26, 85, 5.5, 2.5, 0xffc83a, { hair: GD2, mark: 'M' }, { lightning: true }),
    ],
  }),
  C('vegeta_ozaru', 'Vegeta Ozaru', 'saiyan', 5, 'giant', 'gigantic_roar', ['gigantic_roar', 'power_impact', 'galick_gun', 'kiai', 'big_bang'], 'planet_burst', alienSprite('#7a4a2a', '#6a3e22', '#6a3e22', 'long', '#5a3418', { eye: '#ff2a2a', tail: '#5a3418', armor: '#e8e0c8', build: 'bulky' }), { family: 'vegeta', size: 2.2 }),
  C('saibaman_p', 'Saibaman', 'saiyan', 1, 'glass', 'absorb', ['absorb', 'rapid_punch', 'ki_blast', 'kiai', 'homing_ki'], 'planet_burst', alienSprite('#5fbf3a', '#4fa830', '#4a9a2c', 'bald', '#5fbf3a', { eye: '#d42020' }), { family: 'saibaman', size: 0.85, desc: 'Pequeño y explosivo. Su definitivo es un abrazo kamikaze.' }),
];

// ===================== SAGA NAMEK Y FREEZER =====================
const FREEZER_SAGA: CharacterDef[] = [
  C('vegeta_namek', 'Vegeta (Namek)', 'freezer', 4, 'glass', 'big_bang', [...SAIYAN, 'kiai'], 'final_flash', vegetaSuit(BK, { gi: '#2a3a8a', armor: '#f0f0f0' }), { family: 'vegeta' }),
  C('gohan_namek', 'Gohan (Namek)', 'freezer', 2, 'blaster', 'masenko', ['masenko', 'kamehameha', 'ki_blast', 'homing_ki', 'kiai'], 'kamehameha_x10', armorSprite('#2a3a8a', '#f0f0f0', BK, 'gohan'), { family: 'gohan', size: 0.78, passive: 'crit_master' }),
  C('nail', 'Nail', 'freezer', 3, 'tank', 'rapid_punch', ['rapid_punch', 'demon_wave', 'ki_blast', 'makankosappo', 'kiai'], 'special_beam', piccoloSp({ hairStyle: 'bald', cape: undefined, gi: '#e8e0c8', pants: '#e8e0c8' }), { passive: 'regeneration' }),
  C('zarbon', 'Zarbon', 'freezer', 2, 'balanced', 'ki_blast', ['ki_blast', 'rapid_punch', 'homing_ki', 'big_bang', 'kiai'], 'planet_burst', freezaSoldier('#8ac8a0', '#2a8a5a', 'long', { earring: GD, cape: '#c84a8a' })),
  C('zarbon_monster', 'Zarbon monstruo', 'freezer', 3, 'tank', 'power_impact', ['power_impact', 'saiyan_rush', 'big_bang', 'kiai', 'ki_blast'], 'planet_burst', freezaSoldier('#3a7a4a', '#1f5a3a', 'long', { build: 'bulky', earring: GD }), { family: 'zarbon', size: 1.2 }),
  C('dodoria', 'Dodoria', 'freezer', 2, 'tank', 'big_bang', ['big_bang', 'power_impact', 'rapid_punch', 'kiai', 'ki_blast'], 'planet_burst', freezaSoldier('#e87aa8', '#e87aa8', 'bald', { horns: '#c84a7a', eye: '#ffe14d', build: 'bulky' }), { size: 1.3 }),
  C('guldo', 'Guldo', 'freezer', 1, 'support', 'time_skip', ['time_skip', 'telekinesis', 'ki_blast', 'homing_ki', 'kiai'], 'planet_burst', freezaSoldier('#6ab86a', '#6ab86a', 'bald', { horns: '#3a6a3a', build: 'bulky' }), { family: 'ginyu_force', size: 0.75, desc: 'Detiene el tiempo y paraliza a los enemigos.' }),
  C('recoome', 'Recoome', 'freezer', 2, 'tank', 'power_impact', ['power_impact', 'saiyan_rush', 'eraser_cannon', 'kiai', 'rapid_punch'], 'planet_burst', freezaSoldier('#f0b090', '#e86a2a', 'wild', { build: 'bulky' }), { family: 'ginyu_force', size: 1.3 }),
  C('burter', 'Burter', 'freezer', 2, 'speedster', 'saiyan_rush', ['saiyan_rush', 'rapid_punch', 'ki_blast', 'wolf_fang', 'homing_ki'], 'planet_burst', freezaSoldier('#4a8ad8', '#4a8ad8', 'bald', { build: 'bulky' }), { family: 'ginyu_force', size: 1.2, desc: 'El más rápido del universo (según él).' }),
  C('jeice', 'Jeice', 'freezer', 2, 'blaster', 'burning_attack', ['burning_attack', 'ki_blast', 'homing_ki', 'rapid_punch', 'kiai'], 'planet_burst', freezaSoldier('#d84a3a', WH, 'bob'), { family: 'ginyu_force' }),
  C('ginyu', 'Capitán Ginyu', 'freezer', 3, 'balanced', 'power_impact', ['power_impact', 'ki_blast', 'telekinesis', 'saiyan_rush', 'homing_ki'], 'planet_burst', freezaSoldier('#7a5ab8', '#7a5ab8', 'bald', { horns: '#3a2a6a' }), { family: 'ginyu_force', passive: 'berserker' }),
  C('freezer_1', 'Freezer (1ª forma)', 'freezer', 4, 'sniper', 'death_beam', ['death_beam', 'telekinesis', 'homing_ki', 'ki_blast', 'destructo_disc'], 'death_ball', freezerSp({ armor: '#f0e8f0', gi: '#2a2440', pants: '#f0eef5' }), {
    family: 'freezer',
    desc: 'Especialista a distancia: Death Beam rapidísimo. Se transforma en partida.',
    forms: [
      form('f2', 'Segunda forma', 8, 45, 3, 1.4, 0xff5ad0, { armor: undefined, gi: '#f0eef5', build: 'bulky' }, { size: 1.3 }),
      form('f3', 'Tercera forma', 16, 60, 4, 1.8, 0xff5ad0, { armor: undefined, gi: '#f0eef5', hair: '#f0eef5', hairStyle: 'crest' }),
      form('final', 'Forma final', 22, 75, 4.5, 2.2, 0xff5ad0, { armor: undefined, gi: '#f0eef5', giAccent: '#8a4ab8', horns: undefined, hairStyle: 'dome' }),
      form('full', 'Freezer 100%', 30, 90, 6, 2.7, 0xff2ad0, { armor: undefined, gi: '#f0eef5', horns: undefined, build: 'bulky' }, { lightning: true }),
    ],
  }),
  C('freezer_2', 'Freezer (2ª forma)', 'freezer', 3, 'tank', 'telekinesis', ['telekinesis', 'death_beam', 'power_impact', 'ki_blast', 'homing_ki'], 'death_ball', freezerSp({ build: 'bulky' }), { family: 'freezer', size: 1.3 }),
  C('freezer_3', 'Freezer (3ª forma)', 'freezer', 4, 'blaster', 'death_beam', ['death_beam', 'homing_ki', 'telekinesis', 'big_bang', 'ki_blast'], 'death_ball', freezerSp({ hair: '#f0eef5', hairStyle: 'crest' }), { family: 'freezer' }),
  C('freezer_final', 'Freezer (forma final)', 'freezer', 5, 'sniper', 'death_beam', ['death_beam', 'destructo_disc', 'telekinesis', 'homing_ki', 'ki_blast'], 'death_ball', freezerSp({ horns: undefined, giAccent: '#8a4ab8' }), { family: 'freezer' }),
  C('freezer_100', 'Freezer 100%', 'freezer', 6, 'sniper', 'death_beam', ['death_beam', 'destructo_disc', 'telekinesis', 'homing_ki', 'big_bang'], 'death_ball', freezerSp({ horns: undefined, build: 'bulky' }), { family: 'freezer', aura: 0xff5ad0, lightning: true }),
];

// ===================== SAGA ANDROIDES Y CELL =====================
const CELL_SAGA: CharacterDef[] = [
  C('trunks', 'Trunks del futuro', 'cell', 3, 'swordsman', 'sword_slash', ['sword_slash', 'burning_attack', 'ki_blast', 'rapid_punch', 'kiai', 'galick_gun'], 'planet_burst', trunksSp(), { desc: 'Espada rápida y Burning Attack. Mucha movilidad.' }),
  C('trunks_ssj', 'Trunks Super Saiyan', 'cell', 4, 'swordsman', 'sword_slash', ['sword_slash', 'burning_attack', 'ki_blast', 'rapid_punch', 'galick_gun'], 'planet_burst', trunksSp(GD, { eye: '#1fa58f' }), { family: 'trunks', aura: 0xffd84a }),
  C('vegeta_ssj', 'Vegeta Super Saiyan', 'cell', 4, 'glass', 'big_bang', SAIYAN, 'final_flash', vegetaSuit(GD, { armor: WH, eye: '#1fa58f' }), { family: 'vegeta', aura: 0xffd84a }),
  C('super_vegeta', 'Super Vegeta', 'cell', 5, 'brawler', 'saiyan_rush', SAIYAN, 'final_flash', vegetaSuit(GD, { armor: WH, eye: '#1fa58f', build: 'bulky' }), { family: 'vegeta', aura: 0xffd84a, size: 1.1 }),
  C('gohan_teen', 'Gohan adolescente', 'cell', 3, 'blaster', 'masenko', ['masenko', 'kamehameha', 'ki_blast', 'homing_ki', 'rapid_punch', 'kiai'], 'kamehameha_x10', gohanGi(BK), {
    family: 'gohan',
    passive: 'crit_master',
    size: 0.9,
    desc: 'Gran potencial: críticos enormes. Se transforma en partida.',
    forms: [form('ssj', 'Super Saiyan', 10, 55, 3.2, 1.6, 0xffd84a, { hair: GD, eye: '#1fa58f' }), form('ssj2', 'Super Saiyan 2', 20, 75, 4.5, 2.2, 0xfff27a, { hair: GD2, eye: '#17c7a8' }, { lightning: true })],
  }),
  C('gohan_ssj', 'Gohan Super Saiyan', 'cell', 4, 'blaster', 'masenko', ['masenko', 'kamehameha', 'ki_blast', 'homing_ki', 'rapid_punch'], 'kamehameha_x10', gohanGi(GD, { eye: '#1fa58f' }), { family: 'gohan', passive: 'crit_master', size: 0.9, aura: 0xffd84a }),
  C('gohan_ssj2', 'Gohan Super Saiyan 2', 'cell', 6, 'blaster', 'kamehameha', ['kamehameha', 'masenko', 'ki_blast', 'homing_ki', 'saiyan_rush'], 'kamehameha_x10', gohanGi(GD2, { eye: '#17c7a8' }), { family: 'gohan', passive: 'crit_master', size: 0.9, aura: 0xfff27a, lightning: true }),
  C('piccolo_kami', 'Piccolo (fusión con Kami)', 'cell', 4, 'tank', 'makankosappo', ['makankosappo', 'hellzone', 'demon_wave', 'ki_blast', 'rapid_punch'], 'special_beam', piccoloSp(), { family: 'piccolo', passive: 'regeneration', aura: 0xffffff }),
  C('android_16', 'Androide 16', 'cell', 4, 'tank', 'power_impact', ['power_impact', 'eraser_cannon', 'rapid_punch', 'android_barrier', 'kiai'], 'planet_burst', armorSprite('#3a6a3a', '#3a6a3a', '#e86a2a', 'mohawk', { skin: '#e8c0a0', boots: '#e8c040', build: 'bulky', mark: RED }), { family: 'android', size: 1.3, desc: 'Enorme y pacífico. Hell Flash y una defensa enorme.' }),
  C('android_17', 'Androide 17', 'cell', 3, 'speedster', 'android_barrier', ['android_barrier', 'energy_disc', 'rapid_punch', 'ki_blast', 'homing_ki'], 'planet_burst', giSprite('#3a3a4a', '#f0f0f0', BK, 'bob', { gi: '#f0f0f0', pants: '#3a5a8a', giAccent: '#d84a2a', boots: '#5a3a2a' }), { family: 'android', passive: 'ki_efficient' }),
  C('android_18', 'Androide 18', 'cell', 3, 'speedster', 'energy_disc', ['energy_disc', 'destructo_disc', 'rapid_punch', 'android_barrier', 'homing_ki'], 'planet_burst', giSprite('#3a3a4a', '#f0f0f0', '#f0d870', 'bob', { gi: '#2a2a3a', pants: '#3a5a8a', boots: '#3a3a3a' }), { family: 'android', passive: 'ki_efficient', desc: 'Muy rápida y su Ki nunca se agota.' }),
  C('android_19', 'Androide 19', 'cell', 2, 'tank', 'absorb', ['absorb', 'energy_disc', 'power_impact', 'kiai', 'ki_blast'], 'planet_burst', alienSprite('#f0f0f0', '#5a3a8a', '#f0d840', 'bald', '#f0f0f0', { build: 'bulky', eye: BK }), { family: 'android', size: 1.15, desc: 'Absorbe energía con las manos y se cura.' }),
  C('dr_gero', 'Dr. Gero', 'cell', 2, 'support', 'absorb', ['absorb', 'energy_disc', 'ki_barrier', 'ki_blast', 'homing_ki'], 'planet_burst', alienSprite('#f0f0f0', '#5a3a8a', '#f0d840', 'long', WH, { beard: WH, eye: BK }), { family: 'android' }),
  C('cell_imperfect', 'Cell imperfecto', 'cell', 3, 'balanced', 'absorb', ['absorb', 'kamehameha', 'death_beam', 'ki_blast', 'makankosappo', 'kiai'], 'kamehameha_x10', cellSp({ build: 'slim' }), {
    family: 'cell',
    passive: 'regeneration',
    desc: 'Ataques variados de todos los guerreros. Se regenera y evoluciona en partida.',
    forms: [
      form('semi', 'Cell semiperfecto', 10, 55, 3, 1.5, 0x6aff6a, { build: 'bulky', skin: '#5fb85a' }, { size: 1.25 }),
      form('perfect', 'Cell perfecto', 20, 70, 4, 2, 0xffd84a, { build: 'normal', skin: '#6ac86a', tail: undefined }),
      form('super', 'Super Perfect Cell', 28, 85, 5, 2.5, 0xffd84a, { build: 'normal', skin: '#7ad87a', tail: undefined }, { lightning: true }),
    ],
  }),
  C('cell_semi', 'Cell semiperfecto', 'cell', 4, 'tank', 'absorb', ['absorb', 'kamehameha', 'death_beam', 'power_impact', 'ki_blast'], 'kamehameha_x10', cellSp({ build: 'bulky' }), { family: 'cell', passive: 'regeneration', size: 1.25 }),
  C('cell_perfect', 'Cell perfecto', 'cell', 5, 'balanced', 'kamehameha', ['kamehameha', 'death_beam', 'destructo_disc', 'makankosappo', 'absorb', 'kiai'], 'kamehameha_x10', cellSp({ tail: undefined }), { family: 'cell', passive: 'regeneration', aura: 0xffd84a }),
  C('cell_super', 'Super Perfect Cell', 'cell', 6, 'balanced', 'kamehameha', ['kamehameha', 'death_beam', 'destructo_disc', 'makankosappo', 'absorb'], 'kamehameha_x10', cellSp({ tail: undefined, skin: '#7ad87a' }), { family: 'cell', passive: 'regeneration', aura: 0xffd84a, lightning: true }),
  C('cell_jr_p', 'Cell Jr.', 'cell', 2, 'speedster', 'rapid_punch', ['rapid_punch', 'ki_blast', 'kamehameha', 'homing_ki', 'kiai'], 'kamehameha_x10', cellSp({ skin: '#4fb8c8', tail: undefined, build: 'slim' }), { family: 'cell', size: 0.72 }),
];

// ===================== SAGA MAJIN BUU =====================
const BUU_SAGA: CharacterDef[] = [
  C('majin_vegeta', 'Majin Vegeta', 'buu', 5, 'glass', 'big_bang', [...SAIYAN, 'kiai'], 'planet_burst', giSprite('#2a3a8a', WH, GD, 'vegeta', { gi: '#2a3a8a', armor: WH, mark: 'M', eye: '#1fa58f' }), { family: 'vegeta', aura: 0xffc83a, lightning: true, desc: 'Daño enorme. Su definitivo es la Final Explosion.' }),
  C('gohan_ultimate', 'Gohan definitivo', 'buu', 6, 'blaster', 'kamehameha', ['kamehameha', 'masenko', 'saiyan_rush', 'ki_blast', 'homing_ki'], 'kamehameha_x10', giSprite('#3a3a8a', RED, BK, 'gohan'), { family: 'gohan', passive: 'crit_master', aura: 0xffffff }),
  C('goten', 'Goten', 'buu', 2, 'balanced', 'kamehameha', ['kamehameha', 'rapid_punch', 'ki_blast', 'kiai', 'homing_ki'], 'kamehameha_x10', gokuGi(BK, 'spiky', { gi: '#3a6ac8', pants: '#3a6ac8', giAccent: '#d84a2a' }), { size: 0.72 }),
  C('trunks_kid', 'Trunks niño', 'buu', 2, 'speedster', 'burning_attack', ['burning_attack', 'rapid_punch', 'ki_blast', 'galick_gun', 'kiai'], 'planet_burst', giSprite('#4a8a3a', '#e8c040', '#b8a0e0', 'bowl', { gi: '#4a8a3a' }), { family: 'trunks', size: 0.72 }),
  C('gotenks', 'Gotenks', 'buu', 4, 'glass', 'homing_ki', ['homing_ki', 'rapid_punch', 'big_bang', 'kiai', 'galick_gun'], 'planet_burst', armorSprite('#3a6ac8', '#f0f0e0', '#b8a0e0', 'spiky', { boots: '#e8c040' }), { size: 0.85, desc: 'Fusión infantil. Ataque Super Fantasma Kamikaze (Ki teledirigido).' }),
  C('gotenks_ssj3', 'Gotenks Super Saiyan 3', 'buu', 6, 'glass', 'homing_ki', ['homing_ki', 'saiyan_rush', 'big_bang', 'galick_gun', 'kiai'], 'planet_burst', armorSprite('#3a6ac8', '#f0f0e0', GD, 'long', { boots: '#e8c040' }), { family: 'gotenks', size: 0.85, aura: 0xffc83a, lightning: true }),
  C('vegito', 'Vegetto', 'buu', 6, 'balanced', 'kamehameha', ['kamehameha', 'galick_gun', 'big_bang', 'saiyan_rush', 'ki_blast'], 'final_flash', giSprite('#f07a1a', '#2a4fb8', BK, 'vegeta', { gi: '#2a4fb8', earring: GD }), { passive: 'saiyan_blood' }),
  C('vegito_ssj', 'Vegetto Super Saiyan', 'buu', 7, 'balanced', 'kamehameha', ['kamehameha', 'galick_gun', 'big_bang', 'saiyan_rush', 'homing_ki'], 'final_flash', giSprite('#f07a1a', '#2a4fb8', GD, 'vegeta', { gi: '#2a4fb8', earring: GD, eye: '#1fa58f' }), { family: 'vegito', aura: 0xffd84a, passive: 'saiyan_blood' }),
  C('kaioshin', 'Kaioshin', 'buu', 2, 'support', 'telekinesis', ['telekinesis', 'ki_barrier', 'ki_blast', 'homing_ki', 'kiai'], 'planet_burst', alienSprite('#b8a0e8', '#e8a04a', '#3a6ac8', 'crest', WH, { earring: '#6aff6a' }), { size: 0.85 }),
  C('kibito', 'Kibito', 'buu', 1, 'support', 'kiai', ['kiai', 'telekinesis', 'ki_blast', 'ki_barrier', 'homing_ki'], 'planet_burst', alienSprite('#f0a0a0', '#e84a4a', '#3a3a6a', 'long', WH)),
  C('dabura', 'Dabura', 'buu', 4, 'tank', 'telekinesis', ['telekinesis', 'sword_slash', 'death_beam', 'power_impact', 'ki_blast'], 'planet_burst', alienSprite('#d84a4a', '#3a2a3a', '#3a2a3a', 'bald', '#d84a4a', { horns: '#e8e0c0', cape: '#2a2a3a', sword: true }), { desc: 'Rey de los demonios. Su saliva petrifica (paraliza).' }),
  C('babidi', 'Babidi', 'buu', 2, 'support', 'telekinesis', ['telekinesis', 'homing_ki', 'ki_blast', 'ki_barrier', 'time_skip'], 'planet_burst', alienSprite('#e8d0a0', '#5a3a8a', '#5a3a8a', 'bald', '#e8d0a0', { mark: 'M', cape: '#8a3a3a' }), { size: 0.75 }),
  C('majin_buu', 'Majin Buu', 'buu', 4, 'tank', 'candy_beam', ['candy_beam', 'stretch_punch', 'ki_blast', 'kiai', 'absorb'], 'planet_burst', buuSp(PINK, { build: 'bulky' }), { family: 'buu', passive: 'regeneration', size: 1.3, desc: 'Muy resistente, se regenera y controla con el rayo de chocolate.' }),
  C('evil_buu', 'Buu malvado', 'buu', 4, 'glass', 'candy_beam', ['candy_beam', 'stretch_punch', 'ki_blast', 'homing_ki', 'absorb'], 'planet_burst', buuSp('#8a8a9a', { build: 'slim' }), { family: 'buu', passive: 'regeneration' }),
  C('super_buu', 'Super Buu', 'buu', 5, 'brawler', 'stretch_punch', ['stretch_punch', 'candy_beam', 'absorb', 'homing_ki', 'kiai'], 'planet_burst', buuSp(PINK, { cape: undefined, gi: PINK }), { family: 'buu', passive: 'regeneration' }),
  C('buutenks', 'Buutenks', 'buu', 6, 'glass', 'homing_ki', ['homing_ki', 'candy_beam', 'stretch_punch', 'big_bang', 'absorb'], 'planet_burst', buuSp(PINK, { cape: undefined, armor: '#f0f0e0' }), { family: 'buu', passive: 'regeneration' }),
  C('buuhan', 'Buuhan', 'buu', 6, 'blaster', 'kamehameha', ['kamehameha', 'candy_beam', 'masenko', 'absorb', 'stretch_punch'], 'kamehameha_x10', buuSp(PINK, { cape: undefined, gi: '#3a3a8a' }), { family: 'buu', passive: 'regeneration' }),
  C('kid_buu', 'Kid Buu', 'buu', 6, 'speedster', 'stretch_punch', ['stretch_punch', 'candy_beam', 'kiai', 'homing_ki', 'absorb'], 'planet_burst', buuSp(PINK, { cape: undefined, gi: PINK, build: 'slim' }), { family: 'buu', passive: 'regeneration', size: 0.85 }),
];

// ===================== DRAGON BALL GT =====================
const ssj4 = (hair: string, pants: string, extra: Partial<SpriteSpec> = {}) =>
  alienSprite(SKIN, '#c8342a', pants, 'long', hair, { gi: '#c8342a', giAccent: '#c8342a', belt: '#f0f0f0', eye: '#ffd84a', tail: '#c8342a', ...extra });
const GT_SAGA: CharacterDef[] = [
  C('goku_gt', 'Goku GT', 'gt', 3, 'speedster', 'power_pole', ['power_pole', 'kamehameha', 'rapid_punch', 'dragon_fist', 'kiai'], 'genkidama', giSprite('#3a6ac8', '#e8c040', BK, 'spiky', { gi: '#3a6ac8', pants: '#e8e0c0' }), { family: 'goku', size: 0.82 }),
  C('goku_ssj4', 'Goku Super Saiyan 4', 'gt', 6, 'brawler', 'dragon_fist', ['dragon_fist', 'kamehameha', 'rapid_punch', 'saiyan_rush', 'kiai'], 'kamehameha_x10', ssj4(BK, '#f0f0f0'), { family: 'goku', aura: 0xff4a4a, passive: 'saiyan_blood' }),
  C('vegeta_gt', 'Vegeta GT', 'gt', 3, 'glass', 'big_bang', SAIYAN, 'final_flash', giSprite('#3a3a4a', '#f0f0f0', BK, 'vegeta', { gi: '#3a3a4a', pants: '#3a3a4a', mustache: BK }), { family: 'vegeta' }),
  C('vegeta_ssj4', 'Vegeta Super Saiyan 4', 'gt', 6, 'glass', 'galick_gun', SAIYAN, 'final_flash', ssj4(BK, '#3a3a6a', { hairStyle: 'vegeta' }), { family: 'vegeta', aura: 0xff4a4a }),
  C('pan', 'Pan', 'gt', 2, 'speedster', 'rapid_punch', ['rapid_punch', 'masenko', 'ki_blast', 'kiai', 'homing_ki'], 'kamehameha_x10', giSprite('#e84a3a', '#f0d040', BK, 'bob', { gi: '#e84a3a', pants: '#3a3a6a', mark: '#f0a040' }), { size: 0.8 }),
  C('trunks_gt', 'Trunks GT', 'gt', 2, 'swordsman', 'sword_slash', ['sword_slash', 'burning_attack', 'ki_blast', 'rapid_punch', 'kiai'], 'planet_burst', trunksSp('#b8a0e0', { sword: false, gi: '#3a6aa8' }), { family: 'trunks' }),
  C('uub', 'Uub', 'gt', 3, 'brawler', 'rapid_punch', ['rapid_punch', 'kamehameha', 'kiai', 'saiyan_rush', 'ki_blast'], 'kamehameha_x10', giSprite('#3a6ac8', '#e84a3a', BK, 'mohawk', { skin: '#8a5a3a' })),
  C('majuub', 'Majuub', 'gt', 4, 'tank', 'candy_beam', ['candy_beam', 'rapid_punch', 'kamehameha', 'kiai', 'stretch_punch'], 'kamehameha_x10', giSprite('#3a6ac8', '#e84a3a', BK, 'mohawk', { skin: '#8a5a3a', build: 'bulky' }), { family: 'uub', passive: 'regeneration' }),
  C('baby_vegeta', 'Baby Vegeta', 'gt', 5, 'blaster', 'galick_gun', ['galick_gun', 'big_bang', 'death_beam', 'homing_ki', 'ki_blast'], 'final_flash', armorSprite('#3a3a4a', '#d84a2a', '#f0f0f0', 'vegeta', { skin: '#d8b090', mark: RED }), { family: 'baby' }),
  C('super_baby2', 'Super Baby 2', 'gt', 6, 'glass', 'galick_gun', ['galick_gun', 'big_bang', 'death_beam', 'eraser_cannon', 'homing_ki'], 'planet_burst', armorSprite('#3a3a4a', '#d84a2a', '#f0f0f0', 'long', { skin: '#d8b090', mark: RED }), { family: 'baby', aura: 0xffa04a }),
  C('super_17', 'Super Androide 17', 'gt', 5, 'tank', 'android_barrier', ['android_barrier', 'energy_disc', 'absorb', 'power_impact', 'rapid_punch'], 'planet_burst', giSprite('#3a3a4a', '#d84a2a', BK, 'long', { gi: '#2a2a3a', pants: '#3a3a3a', build: 'bulky' }), { family: 'android' }),
  C('haze_shenron', 'Haze Shenron', 'gt', 2, 'support', 'absorb', ['absorb', 'homing_ki', 'ki_blast', 'kiai', 'candy_beam'], 'planet_burst', alienSprite('#6a6a8a', '#4a4a6a', '#4a4a6a', 'bald', '#6a6a8a', { horns: '#3a3a5a' }), { family: 'shadow_dragon' }),
  C('eis_shenron', 'Eis Shenron', 'gt', 3, 'sniper', 'energy_disc', ['energy_disc', 'death_beam', 'homing_ki', 'ki_blast', 'telekinesis'], 'planet_burst', alienSprite('#8ad8f0', '#4a8ac8', '#3a5a8a', 'crest', '#c8f0ff', { horns: '#e8f0ff' }), { family: 'shadow_dragon', desc: 'Dragón de hielo: sus disparos ralentizan.' }),
  C('nuova_shenron', 'Nuova Shenron', 'gt', 4, 'brawler', 'burning_attack', ['burning_attack', 'saiyan_rush', 'rapid_punch', 'big_bang', 'kiai'], 'sphere_destruction', alienSprite('#f0a04a', '#d84a2a', '#8a3a2a', 'crest', '#f0d040', { horns: '#f0e0a0' }), { family: 'shadow_dragon', passive: 'tank' }),
  C('syn_shenron', 'Syn Shenron', 'gt', 5, 'blaster', 'eraser_cannon', ['eraser_cannon', 'death_beam', 'homing_ki', 'telekinesis', 'big_bang'], 'death_ball', alienSprite('#e8e8f0', '#3a3a5a', '#3a3a5a', 'crest', '#c8c8e0', { horns: '#3a3a5a', eye: RED }), { family: 'shadow_dragon' }),
  C('omega_shenron', 'Omega Shenron', 'gt', 6, 'giant', 'eraser_cannon', ['eraser_cannon', 'gigantic_roar', 'death_beam', 'power_impact', 'homing_ki'], 'sphere_destruction', alienSprite('#e8e8f0', '#3a3a5a', '#3a3a5a', 'crest', '#c8c8e0', { horns: '#3a3a5a', eye: RED, build: 'bulky', mark: '#ffd84a' }), { family: 'shadow_dragon', size: 1.4, aura: 0x9a9aff }),
  C('gogeta_ssj4', 'Gogeta Super Saiyan 4', 'gt', 7, 'balanced', 'big_bang', ['big_bang', 'kamehameha', 'dragon_fist', 'saiyan_rush', 'galick_gun'], 'kamehameha_x10', ssj4('#d84a4a', '#f0f0f0', { hairStyle: 'vegeta', armor: '#3a3a6a' }), { family: 'gogeta', aura: 0xff4a4a, lightning: true, passive: 'saiyan_blood' }),
];

// ===================== DRAGON BALL SUPER =====================
const vegetaSuper = (hair: string, extra: Partial<SpriteSpec> = {}) => armorSprite('#2a3a8a', WH, hair, 'vegeta', { boots: '#e8c040', ...extra });
const SUPER_SAGA: CharacterDef[] = [
  C('vegeta_god', 'Vegeta Super Saiyan God', 'super', 5, 'glass', 'galick_gun', [...SAIYAN, 'kiai'], 'final_flash', vegetaSuper('#d8264a', { eye: '#d8264a' }), { family: 'vegeta', aura: 0xff4a6a }),
  C('vegeta_blue', 'Vegeta Super Saiyan Blue', 'super', 6, 'glass', 'big_bang', [...SAIYAN, 'kiai'], 'final_flash', vegetaSuper('#3ab0ff', { eye: '#3ab0ff' }), { family: 'vegeta', aura: 0x4ac8ff }),
  C('vegeta_blue_evo', 'Vegeta Blue Evolucionado', 'super', 6, 'brawler', 'saiyan_rush', SAIYAN, 'final_flash', vegetaSuper('#2a7ad8', { eye: '#2a7ad8', build: 'bulky' }), { family: 'vegeta', aura: 0x3a8aff, lightning: true }),
  C('vegeta_ultra_ego', 'Vegeta Ultra Ego', 'super', 7, 'brawler', 'saiyan_rush', [...SAIYAN, 'hakai'], 'sphere_destruction', vegetaSuper('#6a3ab8', { eye: '#c84aff', build: 'bulky' }), { family: 'vegeta', aura: 0xb04aff, lightning: true, passive: 'berserker', desc: 'Cuanto más daño aguanta, más fuerte se hace.' }),
  C('beerus', 'Beerus', 'super', 7, 'glass', 'hakai', ['hakai', 'homing_ki', 'kiai', 'rapid_punch', 'big_bang'], 'sphere_destruction', alienSprite('#8a6aa8', '#1b1b24', '#e8d0a0', 'bald', '#8a6aa8', { eye: '#ffd84a', earring: GD, mark: '#ffd84a' }), { desc: 'Dios de la Destrucción. Daño enorme con el Hakai, poca vida.' }),
  C('whis', 'Whis', 'super', 6, 'support', 'ki_barrier', ['ki_barrier', 'time_skip', 'homing_ki', 'telekinesis', 'kiai'], 'sphere_destruction', alienSprite('#a8c8e8', '#3a2a6a', '#3a2a6a', 'mohawk', WH, { halo: true, earring: '#ffd84a' }), { passive: 'auto_dodge', desc: 'El ángel. Esquiva casi todo y retrocede el tiempo.' }),
  C('champa', 'Champa', 'super', 6, 'tank', 'hakai', ['hakai', 'power_impact', 'kiai', 'homing_ki', 'rapid_punch'], 'sphere_destruction', alienSprite('#8a6aa8', '#1b1b24', '#e8d0a0', 'bald', '#8a6aa8', { eye: '#ffd84a', build: 'bulky' }), { size: 1.15 }),
  C('vados', 'Vados', 'super', 6, 'support', 'homing_ki', ['homing_ki', 'ki_barrier', 'time_skip', 'telekinesis', 'kiai'], 'sphere_destruction', alienSprite('#a8c8e8', '#6a2a6a', '#6a2a6a', 'mohawk', WH, { halo: true }), { passive: 'auto_dodge' }),
  C('hit', 'Hit', 'super', 5, 'speedster', 'time_skip', ['time_skip', 'rapid_punch', 'homing_ki', 'wolf_fang', 'kiai'], 'planet_burst', alienSprite('#a83a6a', '#3a2a2a', '#3a2a2a', 'crest', '#5a2a4a', { eye: '#ffd84a', cape: '#3a2a2a' }), { desc: 'El asesino que salta en el tiempo y paraliza.' }),
  C('cabba', 'Cabba', 'super', 3, 'brawler', 'galick_gun', ['galick_gun', 'saiyan_rush', 'ki_blast', 'kiai', 'homing_ki'], 'final_flash', armorSprite('#3a6a3a', '#e8e0c0', BK, 'spiky'), { passive: 'saiyan_blood' }),
  C('caulifla', 'Caulifla', 'super', 4, 'glass', 'saiyan_rush', ['saiyan_rush', 'ki_blast', 'big_bang', 'homing_ki', 'kiai'], 'planet_burst', giSprite('#d84a6a', '#3a3a4a', BK, 'mohawk', { gi: '#d84a6a', pants: '#3a3a4a' })),
  C('kale', 'Kale', 'super', 4, 'giant', 'eraser_cannon', ['eraser_cannon', 'gigantic_roar', 'power_impact', 'ki_blast', 'rapid_punch'], 'planet_burst', giSprite('#3a8a5a', '#d84a4a', BK, 'bob', { build: 'bulky' }), { size: 1.3, passive: 'berserker' }),
  C('kefla', 'Kefla', 'super', 6, 'glass', 'homing_ki', ['homing_ki', 'saiyan_rush', 'eraser_cannon', 'big_bang', 'kiai'], 'planet_burst', giSprite('#3a8a5a', '#d84a6a', GD, 'mohawk', { earring: '#6aff6a' }), { aura: 0xffd84a }),
  C('frost', 'Frost', 'super', 3, 'sniper', 'death_beam', ['death_beam', 'telekinesis', 'homing_ki', 'ki_blast', 'absorb'], 'death_ball', alienSprite('#e0e8f0', '#4a6ac8', '#4a6ac8', 'dome', '#4a6ac8', { horns: BK }), { family: 'frost' }),
  C('magetta', 'Magetta', 'super', 2, 'tank', 'eraser_cannon', ['eraser_cannon', 'power_impact', 'kiai', 'ki_blast', 'rapid_punch'], 'planet_burst', alienSprite('#5a5a6a', '#3a3a4a', '#3a3a4a', 'bald', '#5a5a6a', { build: 'bulky', eye: '#ff6a2a' }), { size: 1.35, desc: 'Robot de magma. Escupe lava.' }),
  C('botamo', 'Botamo', 'super', 2, 'tank', 'kiai', ['kiai', 'power_impact', 'rapid_punch', 'ki_barrier', 'stretch_punch'], 'planet_burst', alienSprite('#e8c070', '#e86a2a', '#3a3a3a', 'bald', '#e8c070', { build: 'bulky', mustache: '#8a5a2a' }), { size: 1.35, stat: { defense: 1.6 } }),
  C('goku_black', 'Goku Black', 'super', 5, 'swordsman', 'sword_slash', ['sword_slash', 'kamehameha', 'death_beam', 'homing_ki', 'rapid_punch'], 'kamehameha_x10', giSprite('#3a3a4a', '#a83a3a', BK, 'spiky', { gi: '#3a3a4a', pants: '#3a3a4a', earring: '#6aff6a' })),
  C('goku_black_rose', 'Goku Black Rosé', 'super', 6, 'swordsman', 'sword_slash', ['sword_slash', 'kamehameha', 'death_beam', 'homing_ki', 'hakai'], 'kamehameha_x10', giSprite('#3a3a4a', '#a83a3a', '#f05aa8', 'spiky', { gi: '#3a3a4a', pants: '#3a3a4a', earring: '#6aff6a', eye: '#a83a6a' }), { family: 'goku_black', aura: 0xff5aa8 }),
  C('zamasu', 'Zamasu', 'super', 4, 'support', 'telekinesis', ['telekinesis', 'sword_slash', 'homing_ki', 'ki_blast', 'ki_barrier'], 'planet_burst', alienSprite('#7ab88a', '#e8e0c0', '#3a3a6a', 'mohawk', WH, { earring: '#6aff6a' }), { passive: 'regeneration' }),
  C('fused_zamasu', 'Zamasu fusionado', 'super', 6, 'support', 'sword_slash', ['sword_slash', 'telekinesis', 'homing_ki', 'death_beam', 'hakai'], 'sphere_destruction', alienSprite('#7ab88a', '#e8e0c0', '#3a3a6a', 'mohawk', WH, { earring: '#6aff6a', halo: true }), { family: 'zamasu', passive: 'regeneration', aura: 0xff5aa8 }),
  C('jiren', 'Jiren', 'super', 7, 'tank', 'power_impact', ['power_impact', 'rapid_punch', 'kiai', 'ki_blast', 'eraser_cannon'], 'planet_burst', alienSprite('#d8b8b0', '#d84a3a', BK, 'bald', '#d8b8b0', { eye: BK, build: 'bulky' }), { desc: 'Golpes potentes y defensa enorme. Movilidad moderada.' }),
  C('toppo', 'Toppo', 'super', 4, 'tank', 'power_impact', ['power_impact', 'rapid_punch', 'kiai', 'ki_blast', 'eraser_cannon'], 'sphere_destruction', alienSprite('#d8b090', '#d84a3a', BK, 'bald', '#d8b090', { mustache: WH, build: 'bulky' }), { size: 1.25 }),
  C('toppo_god', 'Toppo Dios de la Destrucción', 'super', 6, 'glass', 'hakai', ['hakai', 'power_impact', 'kiai', 'homing_ki', 'eraser_cannon'], 'sphere_destruction', alienSprite('#d8b090', '#3a2a6a', BK, 'bald', '#d8b090', { mustache: WH, build: 'bulky', eye: '#b04aff' }), { family: 'toppo', size: 1.25, aura: 0xb04aff }),
  C('dyspo', 'Dyspo', 'super', 4, 'speedster', 'rapid_punch', ['rapid_punch', 'wolf_fang', 'homing_ki', 'kiai', 'time_skip'], 'planet_burst', alienSprite('#b8a8d8', '#d84a3a', BK, 'crest', '#d8c8f0', { build: 'slim' }), { size: 0.85, stat: { speed: 1.15 } }),
  C('ribrianne', 'Ribrianne', 'super', 3, 'blaster', 'homing_ki', ['homing_ki', 'ki_barrier', 'candy_beam', 'ki_blast', 'kiai'], 'planet_burst', giSprite('#f08ad8', '#f0f0f0', '#f05aa8', 'long', { gi: '#f08ad8' })),
  C('broly', 'Broly', 'super', 4, 'giant', 'eraser_cannon', ['eraser_cannon', 'gigantic_roar', 'power_impact', 'saiyan_rush', 'kiai'], 'planet_burst', brolySp(), {
    size: 1.3,
    desc: 'Muchísima vida y ataques de área, pero lento. Se desata en partida.',
    forms: [
      form('wrath', 'Poder desatado', 10, 50, 3, 1.5, 0x6aff4a, { eye: '#ff3a3a' }, { size: 1.45 }),
      form('ssj', 'Super Saiyan', 18, 65, 4, 1.9, 0xffd84a, { hair: GD, eye: '#1fa58f' }, { size: 1.5 }),
      form('fp', 'Super Saiyan Full Power', 26, 85, 5, 2.5, 0x6aff4a, { hair: '#d8ff6a', eye: '#ffffff' }, { size: 1.65, lightning: true }),
    ],
  }),
  C('broly_ssj', 'Broly Super Saiyan', 'super', 6, 'giant', 'eraser_cannon', ['eraser_cannon', 'gigantic_roar', 'power_impact', 'saiyan_rush', 'kiai'], 'planet_burst', brolySp(GD, { eye: '#1fa58f' }), { family: 'broly', size: 1.5, aura: 0x6aff4a, lightning: true }),
  C('gogeta_blue', 'Gogeta Blue', 'super', 7, 'balanced', 'kamehameha', ['kamehameha', 'big_bang', 'galick_gun', 'saiyan_rush', 'dragon_fist'], 'kamehameha_x10', giSprite('#3a3a8a', OR, '#3ab0ff', 'vegeta', { armor: '#f0f0e0', eye: '#3ab0ff', earring: GD }), { family: 'gogeta', aura: 0x4ac8ff, passive: 'saiyan_blood' }),
  C('moro', 'Moro', 'super', 5, 'support', 'absorb', ['absorb', 'telekinesis', 'homing_ki', 'ki_barrier', 'eraser_cannon'], 'planet_burst', alienSprite('#d8d8c8', '#3a6a3a', '#3a6a3a', 'bald', '#d8d8c8', { horns: '#8a8a7a', beard: '#c8c8b8' }), { passive: 'regeneration', desc: 'Absorbe la energía de los enemigos para curarse.' }),
  C('granolah', 'Granolah', 'super', 5, 'sniper', 'death_beam', ['death_beam', 'dodonpa', 'homing_ki', 'ki_blast', 'energy_disc'], 'special_beam', alienSprite('#e8a0a0', '#3a3a5a', '#3a3a5a', 'crest', '#e8a0a0', { eye: '#ffd84a' }), { passive: 'crit_master', desc: 'El francotirador más fuerte del universo.' }),
  C('gas', 'Gas', 'super', 5, 'brawler', 'saiyan_rush', ['saiyan_rush', 'power_impact', 'eraser_cannon', 'ki_blast', 'kiai'], 'planet_burst', alienSprite('#8a8ab8', '#3a3a5a', '#3a3a5a', 'mohawk', '#2a2a4a', { build: 'bulky' }), { size: 1.2, passive: 'berserker' }),
  C('gamma_1', 'Gamma 1', 'super', 3, 'sniper', 'energy_disc', ['energy_disc', 'death_beam', 'android_barrier', 'ki_blast', 'homing_ki'], 'kamehameha_x10', armorSprite('#3a3a4a', '#d84a3a', BK, 'flat', { skin: '#e8e0e0', cape: '#d84a3a', mark: '1' }), { family: 'gamma' }),
  C('gamma_2', 'Gamma 2', 'super', 3, 'speedster', 'energy_disc', ['energy_disc', 'rapid_punch', 'android_barrier', 'ki_blast', 'homing_ki'], 'kamehameha_x10', armorSprite('#3a3a4a', '#3a6ad8', BK, 'flat', { skin: '#e8e0e0', cape: '#3a6ad8', mark: '2' }), { family: 'gamma' }),
  C('cell_max', 'Cell Max', 'super', 6, 'giant', 'gigantic_roar', ['gigantic_roar', 'power_impact', 'eraser_cannon', 'absorb', 'kiai'], 'planet_burst', cellSp({ skin: '#d84a4a', build: 'bulky', tail: undefined }), { family: 'cell', size: 2, passive: 'tank' }),
  C('orange_piccolo', 'Orange Piccolo', 'super', 6, 'giant', 'makankosappo', ['makankosappo', 'hellzone', 'demon_wave', 'power_impact', 'gigantic_roar'], 'special_beam', piccoloSp({ skin: '#f08a3a', antenna: '#c86a2a', build: 'bulky', cape: undefined }), { family: 'piccolo', size: 1.4, passive: 'regeneration' }),
  C('gohan_beast', 'Gohan Beast', 'super', 7, 'blaster', 'makankosappo', ['makankosappo', 'masenko', 'kamehameha', 'saiyan_rush', 'homing_ki'], 'special_beam', giSprite('#3a3a8a', RED, '#e8e8f0', 'wild', { eye: '#d84a4a' }), { family: 'gohan', passive: 'crit_master', aura: 0xd8a0ff, lightning: true, desc: 'El poder bestial de Gohan. Special Beam Cannon definitivo.' }),
  C('golden_freezer', 'Golden Freezer', 'super', 6, 'sniper', 'death_beam', ['death_beam', 'destructo_disc', 'telekinesis', 'homing_ki', 'big_bang'], 'death_ball', freezerSp({ skin: '#ffd84a', gi: '#ffd84a', pants: '#ffd84a', horns: undefined, giAccent: '#8a4ab8', tail: '#ffd84a' }), { family: 'freezer', aura: 0xffd84a }),
  C('black_freezer', 'Black Freezer', 'super', 7, 'sniper', 'death_beam', ['death_beam', 'destructo_disc', 'telekinesis', 'homing_ki', 'hakai'], 'death_ball', freezerSp({ skin: '#3a3a4a', gi: '#3a3a4a', pants: '#3a3a4a', horns: undefined, giAccent: '#d84a4a', tail: '#3a3a4a', eye: '#d84a4a' }), { family: 'freezer', aura: 0x8a4ab8, lightning: true }),
];

// ===================== DRAGON BALL DAIMA =====================
const DAIMA_SAGA: CharacterDef[] = [
  C('goku_daima', 'Goku (Daima)', 'daima', 3, 'speedster', 'power_pole', ['power_pole', 'kamehameha', 'rapid_punch', 'dragon_fist', 'kiai'], 'kamehameha_x10', gokuGi(BK), { family: 'goku', size: 0.75, desc: 'Goku convertido en niño. Recupera el Báculo Sagrado.' }),
  C('goku_daima_ssj4', 'Goku SSJ4 (Daima)', 'daima', 7, 'brawler', 'dragon_fist', ['dragon_fist', 'kamehameha', 'rapid_punch', 'saiyan_rush', 'power_pole'], 'kamehameha_x10', ssj4(BK, '#3a6ac8'), { family: 'goku', size: 0.85, aura: 0xff4a4a, lightning: true, passive: 'saiyan_blood' }),
  C('vegeta_daima', 'Vegeta (Daima)', 'daima', 3, 'glass', 'galick_gun', SAIYAN, 'final_flash', vegetaSuit(BK), { family: 'vegeta', size: 0.75 }),
  C('vegeta_daima_ssj3', 'Vegeta SSJ3 (Daima)', 'daima', 6, 'glass', 'big_bang', SAIYAN, 'final_flash', vegetaSuit(GD, { hairStyle: 'long', eye: '#1fa58f' }), { family: 'vegeta', size: 0.78, aura: 0xffc83a, lightning: true }),
  C('shin_mini', 'Kaioshin (Daima)', 'daima', 2, 'support', 'telekinesis', ['telekinesis', 'ki_barrier', 'homing_ki', 'ki_blast', 'kiai'], 'planet_burst', alienSprite('#b8a0e8', '#e8a04a', '#3a6ac8', 'crest', WH), { family: 'kaioshin', size: 0.75 }),
  C('glorio', 'Glorio', 'daima', 3, 'balanced', 'ki_blast', ['ki_blast', 'rapid_punch', 'homing_ki', 'telekinesis', 'kiai'], 'planet_burst', alienSprite('#a8c8f0', '#3a3a6a', '#3a3a6a', 'flat', '#3a3a8a', { horns: '#8a8ac8' }), { desc: 'El misterioso Majin ayudante. Su tercer ojo se abre.' }),
  C('majin_kuu', 'Majin Kuu', 'daima', 3, 'tank', 'candy_beam', ['candy_beam', 'stretch_punch', 'kiai', 'absorb', 'ki_blast'], 'planet_burst', buuSp('#e8a0e0', { build: 'bulky', cape: undefined }), { family: 'majin_daima', size: 1.1, passive: 'regeneration' }),
  C('majin_duu', 'Majin Duu', 'daima', 3, 'brawler', 'stretch_punch', ['stretch_punch', 'candy_beam', 'rapid_punch', 'absorb', 'kiai'], 'planet_burst', buuSp('#8ac8e8', { build: 'bulky', cape: undefined }), { family: 'majin_daima', size: 1.1, passive: 'regeneration' }),
  C('gomah', 'Gomah', 'daima', 5, 'blaster', 'eraser_cannon', ['eraser_cannon', 'homing_ki', 'telekinesis', 'death_beam', 'ki_blast'], 'sphere_destruction', alienSprite('#4a8ad8', '#3a2a5a', '#3a2a5a', 'bald', '#4a8ad8', { horns: '#e8e0c0', cape: '#8a2a4a', mark: '#ffd84a' }), { desc: 'El nuevo Rey Demonio. Gran poder de energía.' }),
  C('degesu', 'Degesu', 'daima', 4, 'speedster', 'rapid_punch', ['rapid_punch', 'wolf_fang', 'homing_ki', 'time_skip', 'kiai'], 'planet_burst', alienSprite('#3a8ad8', '#3a3a4a', '#3a3a4a', 'bald', '#3a8ad8', { horns: '#e8e0c0' }), { desc: 'Rapidísimo y astuto. Se mueve en el tiempo.' }),
  C('panzy', 'Panzy', 'daima', 2, 'support', 'ki_barrier', ['ki_barrier', 'homing_ki', 'ki_blast', 'telekinesis', 'kiai'], 'planet_burst', alienSprite('#f0c0a0', '#e86ab8', '#3a3a8a', 'bob', '#f0e060'), { size: 0.75 }),
  C('arinsu', 'Arinsu', 'daima', 3, 'glass', 'homing_ki', ['homing_ki', 'telekinesis', 'ki_blast', 'death_beam', 'kiai'], 'planet_burst', alienSprite('#a8e0a0', '#5a2a8a', '#5a2a8a', 'long', '#3a8a3a', { antenna: '#3a8a3a' })),
  C('neva', 'Neva', 'daima', 3, 'support', 'ki_barrier', ['ki_barrier', 'telekinesis', 'kiai', 'homing_ki', 'ki_blast'], 'planet_burst', alienSprite('#5fb84a', '#3a3a6a', '#3a3a6a', 'bald', '#5fb84a', { antenna: '#3f8a30', beard: '#e8e8e8' }), { passive: 'regeneration' }),
  C('tamagami', 'Tamagami', 'daima', 4, 'tank', 'power_impact', ['power_impact', 'sword_slash', 'kiai', 'android_barrier', 'rapid_punch'], 'planet_burst', alienSprite('#c8c8d8', '#3a3a4a', '#3a3a4a', 'crest', '#8a8a9a', { build: 'bulky', sword: true }), { size: 1.25, desc: 'Guardián de las Bolas de Dragón de Neva.' }),
  C('piccolo_daima', 'Piccolo (Daima)', 'daima', 4, 'tank', 'makankosappo', ['makankosappo', 'hellzone', 'demon_wave', 'ki_blast', 'rapid_punch'], 'special_beam', piccoloSp(), { family: 'piccolo', passive: 'regeneration' }),
];

// ===================== PELÍCULAS =====================
const MOVIES: CharacterDef[] = [
  C('bardock', 'Bardock', 'movies', 3, 'brawler', 'saiyan_rush', ['saiyan_rush', 'big_bang', 'ki_blast', 'kiai', 'galick_gun'], 'planet_burst', saiyanArmor(BK, 'spiky', { armor: '#3a6a3a', mark: RED }), { passive: 'saiyan_blood', desc: 'El padre de Goku. Lucha hasta el final.' }),
  C('turles', 'Turles', 'movies', 3, 'blaster', 'big_bang', ['big_bang', 'ki_blast', 'saiyan_rush', 'homing_ki', 'absorb'], 'planet_burst', saiyanArmor(BK, 'spiky', { skin: '#8a5a3a' }), { passive: 'regeneration', desc: 'Se cura con el fruto del Árbol Sagrado.' }),
  C('slug', 'Slug', 'movies', 4, 'giant', 'demon_wave', ['demon_wave', 'stretch_punch', 'makankosappo', 'power_impact', 'ki_blast'], 'planet_burst', piccoloSp({ cape: '#3a3a3a', gi: '#3a3a3a', build: 'bulky', hairStyle: 'bald' }), { size: 1.4 }),
  C('cooler', 'Cooler', 'movies', 4, 'sniper', 'death_beam', ['death_beam', 'big_bang', 'telekinesis', 'homing_ki', 'ki_blast'], 'death_ball', freezerSp({ skin: '#e0e0f0', giAccent: '#5a3a8a', horns: BK }), { family: 'cooler' }),
  C('metal_cooler', 'Metal Cooler', 'movies', 5, 'tank', 'death_beam', ['death_beam', 'android_barrier', 'energy_disc', 'absorb', 'power_impact'], 'death_ball', freezerSp({ skin: '#a8a8c0', gi: '#a8a8c0', pants: '#a8a8c0', eye: '#ff3a3a', horns: '#6a6a8a' }), { family: 'cooler', passive: 'regeneration' }),
  C('android_13', 'Androide 13', 'movies', 3, 'brawler', 'rapid_punch', ['rapid_punch', 'energy_disc', 'power_impact', 'ki_blast', 'kiai'], 'planet_burst', giSprite('#3a5a8a', '#e8c040', '#f0f0f0', 'flat', { gi: '#3a5a8a', pants: '#3a5a8a' }), { family: 'android' }),
  C('super_13', 'Super Androide 13', 'movies', 5, 'giant', 'eraser_cannon', ['eraser_cannon', 'power_impact', 'energy_disc', 'rapid_punch', 'kiai'], 'planet_burst', alienSprite('#8ab8e8', '#3a3a4a', '#3a3a4a', 'mohawk', '#d84a4a', { build: 'bulky' }), { family: 'android', size: 1.4 }),
  C('broly_classic', 'Broly (clásico)', 'movies', 5, 'giant', 'eraser_cannon', ['eraser_cannon', 'gigantic_roar', 'power_impact', 'saiyan_rush', 'kiai'], 'planet_burst', brolySp(BK, { cape: '#d84a2a' }), { family: 'broly', size: 1.35 }),
  C('broly_lssj', 'Broly Super Saiyan Legendario', 'movies', 7, 'giant', 'eraser_cannon', ['eraser_cannon', 'gigantic_roar', 'power_impact', 'saiyan_rush', 'big_bang'], 'planet_burst', brolySp('#b8ff6a', { eye: '#ffffff', cape: '#d84a2a' }), { family: 'broly', size: 1.6, aura: 0x6aff4a, lightning: true }),
  C('bojack', 'Bojack', 'movies', 4, 'brawler', 'saiyan_rush', ['saiyan_rush', 'big_bang', 'power_impact', 'ki_blast', 'kiai'], 'planet_burst', alienSprite('#6ab8b8', '#3a3a5a', '#3a3a5a', 'long', '#d84a4a', { cape: '#3a3a5a' })),
  C('zangya', 'Zangya', 'movies', 3, 'speedster', 'homing_ki', ['homing_ki', 'ki_blast', 'rapid_punch', 'telekinesis', 'kiai'], 'planet_burst', alienSprite('#6ab8b8', '#3a3a5a', '#3a3a5a', 'long', '#f08a3a')),
  C('janemba', 'Janemba', 'movies', 4, 'tank', 'candy_beam', ['candy_beam', 'stretch_punch', 'absorb', 'kiai', 'homing_ki'], 'planet_burst', alienSprite('#f0c040', '#d84a8a', '#d84a8a', 'bald', '#f0c040', { build: 'bulky', horns: '#d84a8a' }), { size: 1.4, passive: 'regeneration' }),
  C('super_janemba', 'Super Janemba', 'movies', 6, 'swordsman', 'sword_slash', ['sword_slash', 'time_skip', 'homing_ki', 'stretch_punch', 'death_beam'], 'planet_burst', alienSprite('#d84a4a', '#3a2a3a', '#3a2a3a', 'crest', '#3a2a3a', { horns: '#3a2a3a', tail: '#d84a4a', sword: true }), { family: 'janemba', aura: 0xd84a4a }),
  C('gogeta', 'Gogeta', 'movies', 7, 'balanced', 'big_bang', ['big_bang', 'kamehameha', 'galick_gun', 'saiyan_rush', 'dragon_fist'], 'kamehameha_x10', giSprite('#3a3a8a', OR, GD, 'vegeta', { armor: '#f0f0e0', eye: '#1fa58f', earring: GD }), { family: 'gogeta', aura: 0xffd84a, passive: 'saiyan_blood' }),
  C('tapion', 'Tapion', 'movies', 3, 'swordsman', 'sword_slash', ['sword_slash', 'rapid_punch', 'ki_barrier', 'kiai', 'homing_ki'], 'planet_burst', alienSprite('#e8c0a0', '#8a5a3a', '#5a3a2a', 'long', '#e86a2a', { sword: true, cape: '#5a3a2a' })),
  C('hirudegarn', 'Hirudegarn', 'movies', 6, 'giant', 'gigantic_roar', ['gigantic_roar', 'power_impact', 'eraser_cannon', 'stretch_punch', 'kiai'], 'planet_burst', alienSprite('#8a6a4a', '#5a3a2a', '#5a3a2a', 'crest', '#5a3a2a', { horns: '#e8e0c0', tail: '#8a6a4a', build: 'bulky', eye: '#ffd84a' }), { size: 2, passive: 'tank' }),
  C('garlic_jr', 'Garlic Jr.', 'movies', 3, 'support', 'telekinesis', ['telekinesis', 'demon_wave', 'homing_ki', 'ki_blast', 'kiai'], 'planet_burst', alienSprite('#a8c8a8', '#3a3a5a', '#3a3a5a', 'bald', '#a8c8a8', { cape: '#8a2a2a' }), { size: 0.8, passive: 'regeneration' }),
];

export const ROSTER: CharacterDef[] = [...CLASSIC, ...SAIYAN_SAGA, ...FREEZER_SAGA, ...CELL_SAGA, ...BUU_SAGA, ...GT_SAGA, ...SUPER_SAGA, ...DAIMA_SAGA, ...MOVIES];
