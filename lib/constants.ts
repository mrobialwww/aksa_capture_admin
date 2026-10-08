export const HURUF_LIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const KATA_LIST = ["aku", "saya", "kamu", "perkenalkan", "nama", "apa", "selamat pagi", "siapa", "dari", "mana"];

const _groupedKata = [
    ["aku", "saya", "kamu"],
    ["perkenalkan", "nama"],
    ["apa", "selamat pagi", "siapa"],
    ["dari", "mana"],
]
    .map((group) => group.filter((w) => KATA_LIST.includes(w)))
    .filter((g) => g.length > 0);

const ungroupedKata = KATA_LIST.filter((w) => !_groupedKata.flat().includes(w));
if (ungroupedKata.length > 0) _groupedKata.push(ungroupedKata);

export const GROUPED_KATA_LIST = _groupedKata;

const _desktopRows: string[][][] = [];
const remainingGroups = [..._groupedKata];

while (remainingGroups.length > 0) {
    const row: string[][] = [];
    let rowLen = 0;

    for (let i = 0; i < remainingGroups.length; i++) {
        if (rowLen + remainingGroups[i].length <= 6) {
            row.push(remainingGroups[i]);
            rowLen += remainingGroups[i].length;
            remainingGroups.splice(i, 1);
            i--; // adjust index since we removed an item
        }
    }
    _desktopRows.push(row);
}

export const DESKTOP_KATA_ROWS = _desktopRows;
