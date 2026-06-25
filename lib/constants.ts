export const HURUF_LIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const KATA_LIST = [
    "selamat pagi",
    "selamat siang",
    "selamat sore",
    "selamat malam",
    "aku",
    "saya",
    "kamu",
    "dari",
    "mana",
    "berasal",
    "halo",
    "kabar",
    "salam kenal",
    "apa",
    "siapa",
    "perkenalkan",
    "nama",
    "sayang",
    "marah",
];

const _groupedKata = [
    ["selamat pagi", "selamat siang", "selamat sore", "selamat malam"],
    ["aku", "saya", "kamu"],
    ["dari", "mana", "berasal"],
    ["halo", "kabar", "salam kenal"],
    ["apa", "siapa"],
    ["perkenalkan", "nama"],
].map(group => group.filter(w => KATA_LIST.includes(w))).filter(g => g.length > 0);

const ungroupedKata = KATA_LIST.filter(w => !_groupedKata.flat().includes(w));
if (ungroupedKata.length > 0) _groupedKata.push(ungroupedKata);

export const GROUPED_KATA_LIST = _groupedKata;
