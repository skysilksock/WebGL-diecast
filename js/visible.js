const names = [
    "ZQ800-C483003-1#³é·çÕÖ½Ó¿Ú_15", // 遮风罩
    "PRESTIGE_DCC800-C483003-01#Õ¹ÀÀ»úîÓ½ð×Ü×°_14", // 侧面挡板
    "PRESTIGE_DCC800ÅçÎíM-710iC×Ü×°_13" // 喷雾机器人
]

export function AntiVisible(obj) {
    for (const child of obj.children) {
        if (names.indexOf(child.name) != -1) {
            child.visible = false
        }
    }
}