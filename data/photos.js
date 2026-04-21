/**
 * photos.js — 摄影作品数据文件
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  如何添加一张新照片：                                        ║
 * ║  1. 把图片放入 images/photos/ 目录                          ║
 * ║  2. 在下方 PHOTOS 数组中复制一个 {} 条目并填写信息              ║
 * ║  3. 保存文件，刷新页面即可看到更新                              ║
 * ║  （也可以打开 admin.html，用表单自动生成条目代码）               ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * category 可选值:  "landscape" | "street" | "nature" | "portrait"
 * orientation:     "landscape" | "portrait"
 * featured:        true = 该照片显示为全宽大图
 */
const PHOTOS = [
  {
    src: "https://picsum.photos/seed/haze01/1600/900",
    title: "云海之间",
    titleEn: "Sea of Clouds",
    location: "黄山，安徽",
    date: "2024-03",
    description: "在黄山顶峰等候了整整一夜，天光将破时，云海从山谷涌来，漫过松林，如同另一片大洋。此刻的寒意与疲惫，都值得。",
    category: "landscape",
    featured: true,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/seed/rain22/800/1100",
    title: "霓虹雨夜",
    titleEn: "Neon Rain",
    location: "上海，武康路",
    date: "2024-01",
    description: "雨后的路面将霓虹灯折射成长长的光带，行人撑伞匆匆而过，留下一道道模糊的剪影。",
    category: "street",
    featured: false,
    orientation: "portrait",
  },
  {
    src: "https://picsum.photos/seed/ridge77/800/1100",
    title: "山脊",
    titleEn: "The Ridge",
    location: "贡嘎山，四川",
    date: "2023-10",
    description: "清晨六点，站在海拔四千米的山脊上，第一道阳光刚刚触碰雪线。世界无声，只有风。",
    category: "landscape",
    featured: false,
    orientation: "portrait",
  },
  {
    src: "https://picsum.photos/seed/lane44/1600/900",
    title: "晨光里的小巷",
    titleEn: "Morning Lane",
    location: "成都，宽窄巷子",
    date: "2023-08",
    description: "清早六点，游客尚未涌入，老人牵着狗悠然地走过，阳光从巷口斜斜照来，铺满青石板。",
    category: "street",
    featured: true,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/seed/lake55/1600/900",
    title: "镜湖",
    titleEn: "Mirror Lake",
    location: "九寨沟，四川",
    date: "2023-06",
    description: "水面平静如镜，远山与云朵倒映其中，难以分辨哪边是真实。",
    category: "landscape",
    featured: false,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/seed/kiosk88/800/1100",
    title: "深夜书报亭",
    titleEn: "Late Night Kiosk",
    location: "北京，三里屯",
    date: "2023-04",
    description: "午夜十二点，橙黄的灯光是整条街最后的温暖。老板在读一本翻旧了的杂志，不知等待谁。",
    category: "street",
    featured: false,
    orientation: "portrait",
  },
  {
    src: "https://picsum.photos/seed/snow33/1600/900",
    title: "初雪",
    titleEn: "First Snow",
    location: "哈尔滨，黑龙江",
    date: "2022-12",
    description: "第一场雪总是最干净的。它落在一切上面，把城市还给它自己。",
    category: "landscape",
    featured: false,
    orientation: "landscape",
  },
  {
    src: "https://picsum.photos/seed/dusk99/800/1100",
    title: "暮色",
    titleEn: "Dusk",
    location: "拉萨，西藏",
    date: "2022-09",
    description: "布达拉宫在余晖中渐渐变暗，转经筒的声音从远处传来，混入晚风里。",
    category: "landscape",
    featured: false,
    orientation: "portrait",
  },
];
