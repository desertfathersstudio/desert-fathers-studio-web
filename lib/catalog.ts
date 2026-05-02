import { D2C_PRICE, HWP_PACK_PRICE, RP_PACK_PRICE } from "./pricing";

export type CategoryKey =
  | "all"
  | "individuals"
  | "packs"
  | "christ"
  | "our-lady"
  | "angels"
  | "saints"
  | "prophets"
  | "scenes"
  | "holy-week"
  | "resurrection";

export interface Sticker {
  id: string;
  name: string;
  filename: string;
  price: number;
  category: Exclude<CategoryKey, "all">;
  isPack?: boolean;
  packSize?: number;
  isNew?: boolean;
  packOnly?: boolean;
}

export const CATEGORY_LABELS: Record<Exclude<CategoryKey, "all" | "individuals">, string> = {
  packs: "Packs",
  christ: "Christ",
  "our-lady": "Our Lady",
  angels: "Angels",
  saints: "Saints",
  prophets: "Prophets & Patriarchs",
  scenes: "Scenes",
  "holy-week": "Holy Week",
  resurrection: "Resurrection",
};

export const CATEGORY_ORDER: Exclude<CategoryKey, "all" | "individuals">[] = [
  "packs", "christ", "our-lady", "angels", "saints",
  "prophets", "scenes", "holy-week", "resurrection",
];

export const CATALOG: Sticker[] = [
  // PACKS
  { id: "holy-week-pack",    name: "Holy Week Pack",      filename: "Holy Week Pack BACK.png",    price: HWP_PACK_PRICE, category: "packs", isPack: true, packSize: 23 },
  { id: "resurrection-pack", name: "Resurrection Pack",   filename: "Resurrection Pack BACK.png", price: RP_PACK_PRICE,  category: "packs", isPack: true, packSize: 10 },

  // CHRIST
  { id: "pantokrator",     name: "Pantokrator",       filename: "Pantokrator.png",        price: D2C_PRICE, category: "christ" },
  { id: "good-shepherd",   name: "Good Shepherd",     filename: "Good Shepherd.png",      price: D2C_PRICE, category: "christ" },
  { id: "lover-children",  name: "Lover of Children", filename: "Lover of Children.png",  price: D2C_PRICE, category: "christ" },
  { id: "transfiguration", name: "Transfiguration",   filename: "Transfiguration.png",    price: D2C_PRICE, category: "christ" },
  { id: "crucifixion",     name: "The Crucifixion",   filename: "The Cruxifiction.png",   price: D2C_PRICE, category: "christ" },

  // OUR LADY
  { id: "ti-theotokos",   name: "Ti Theotokos",           filename: "Ti Theotokos.png",           price: D2C_PRICE, category: "our-lady" },
  { id: "mother-of-jesus", name: "Mother of Jesus Christ", filename: "Mother of Jesus Christ.png", price: D2C_PRICE, category: "our-lady" },

  // ANGELS
  { id: "archangel-michael",  name: "Archangel Michael",  filename: "Archangel Michael.png",  price: D2C_PRICE, category: "angels", isNew: true },
  { id: "archangel-gabriel",  name: "Archangel Gabriel",  filename: "Archangel Gabriel.png",  price: D2C_PRICE, category: "angels" },
  { id: "archangel-raphael",  name: "Archangel Raphael",  filename: "Archangel Raphael.png",  price: D2C_PRICE, category: "angels" },
  { id: "seven-archangels",   name: "Seven Archangels",   filename: "Seven Archangels.png",   price: D2C_PRICE, category: "angels" },

  // SAINTS — modern
  { id: "pope-shenouda-liturgy", name: "Pope Shenouda III — Liturgy", filename: "Pope Shenouda - Liturgy.png",    price: D2C_PRICE, category: "saints" },
  { id: "pope-shenouda-joy",     name: "Pope Shenouda III — Joy",     filename: "Pope Shenouda Laughing V2.png",  price: D2C_PRICE, category: "saints" },
  { id: "pope-kirillos",         name: "Pope Kyrillos VI",            filename: "Pope Kirillos.png",              price: D2C_PRICE, category: "saints" },
  { id: "habib-girgis",          name: "Archdeacon Habib Girgis",     filename: "Archdeacon Habib Girgis.png",    price: D2C_PRICE, category: "saints" },
  { id: "tamav-irini",           name: "Tamav Irini",                 filename: "Tamav Irini.png",                price: D2C_PRICE, category: "saints" },
  { id: "fr-mina-aboud",         name: "Fr. Mina Aboud",              filename: "Fr. Mina Aboud.png",             price: D2C_PRICE, category: "saints" },
  { id: "abouna-bishoy-kamel",   name: "Fr. Bishoy Kamel",            filename: "Abouna Bishoy Kamel.png",        price: D2C_PRICE, category: "saints" },
  { id: "abouna-feltaos",        name: "Abouna Philtaous",            filename: "Abouna Feltaos.png",             price: D2C_PRICE, category: "saints" },
  { id: "anba-wannas",           name: "Anba Youannis",               filename: "Anba Wannas.png",                price: D2C_PRICE, category: "saints" },
  { id: "saint-abraam",          name: "Bishop Abraam",               filename: "Saint Abraam.png",               price: D2C_PRICE, category: "saints" },
  // martyrs & monastics
  { id: "st-george",           name: "St. George",                     filename: "St. George.png",                          price: D2C_PRICE, category: "saints" },
  { id: "st-demiana",          name: "St. Demiana",                    filename: "St. Demiana.png",                         price: D2C_PRICE, category: "saints" },
  { id: "st-marina-nun",       name: "St. Marina the Nun",             filename: "St. Marina the Nun.png",                  price: D2C_PRICE, category: "saints" },
  { id: "st-marina-martyr",    name: "St. Marina the Martyr",          filename: "St. Marina the Marty and the Nun.png",    price: D2C_PRICE, category: "saints" },
  { id: "st-justina",          name: "St. Justina",                    filename: "St Justina.png",                          price: D2C_PRICE, category: "saints" },
  { id: "saint-abanoub",       name: "St. Abanoub",                    filename: "Saint Abanoub.png",                       price: D2C_PRICE, category: "saints" },
  { id: "saint-philopateer",   name: "St. Philopateer",                filename: "Saint Philopateer.png",                   price: D2C_PRICE, category: "saints" },
  { id: "martyrs-of-libya",    name: "Martyrs of Libya",               filename: "Martyrs of Libya.png",                   price: D2C_PRICE, category: "saints" },
  { id: "st-stephen",          name: "St. Stephen",                    filename: "St. Stephen.png",                         price: D2C_PRICE, category: "saints" },
  { id: "st-bishoy",           name: "St. Bishoy",                     filename: "Saint Bishoy.png",                        price: D2C_PRICE, category: "saints" },
  { id: "ava-antonios",        name: "St. Antony the Great",           filename: "Ava Antonios.png",                        price: D2C_PRICE, category: "saints" },
  { id: "ava-arsenious",       name: "St. Arsenius the Great",         filename: "Ava Arsenious.png",                       price: D2C_PRICE, category: "saints" },
  { id: "ava-ignatius",        name: "St. Ignatius",                   filename: "Ava Ignatius.png",                        price: D2C_PRICE, category: "saints" },
  { id: "saint-john-kame",     name: "St. John the Short",             filename: "Saint John Kame.png",                     price: D2C_PRICE, category: "saints" },
  { id: "saint-karas",         name: "St. Karas",                      filename: "Saint Karas.png",                         price: D2C_PRICE, category: "saints" },
  { id: "st-moses",            name: "St. Moses the Strong",           filename: "St Moses.png",                            price: D2C_PRICE, category: "saints" },
  { id: "st-paesa",            name: "St. Paesa",                      filename: "St Paesa.png",                            price: D2C_PRICE, category: "saints" },
  { id: "st-rewis",            name: "St. Rewis",                      filename: "St Rewis.png",                            price: D2C_PRICE, category: "saints" },
  { id: "aba-mina",            name: "St. Mina",                       filename: "Aba Mina.png",                            price: D2C_PRICE, category: "saints" },
  { id: "samuel-confessor",    name: "St. Samuel the Confessor",       filename: "Saint Samuel the Confessor.png",          price: D2C_PRICE, category: "saints" },
  { id: "st-zosima",           name: "St. Zosima",                     filename: "St. Zosima.png",                          price: D2C_PRICE, category: "saints" },
  { id: "st-mary-egypt",       name: "St. Mary of Egypt",              filename: "St. Mary of Egypt.png",                  price: D2C_PRICE, category: "saints" },
  { id: "st-pachom-tadros",    name: "Ss. Pachomius & Theodore",       filename: "St. Pachom and St. Tadros.png",           price: D2C_PRICE, category: "saints" },
  { id: "maximos-domadious",   name: "Ss. Maximos & Dometius",         filename: "Maximos and Domadious.png",               price: D2C_PRICE, category: "saints" },
  { id: "st-mark",             name: "St. Mark the Evangelist",        filename: "St. Mark.png",                            price: D2C_PRICE, category: "saints" },
  { id: "st-john-ev",          name: "St. John the Evangelist",        filename: "St. John.png",                            price: D2C_PRICE, category: "saints" },
  { id: "peter-paul",          name: "Ss. Peter & Paul",               filename: "Peter and Paul.png",                      price: D2C_PRICE, category: "saints" },
  { id: "four-evangelists",    name: "The Four Evangelists",           filename: "4 Gospel Authors.png",                    price: D2C_PRICE, category: "saints" },
  { id: "st-athanasius",       name: "St. Athanasius",                 filename: "St. Athanasius.png",                      price: D2C_PRICE, category: "saints" },
  { id: "three-saintly-youths", name: "The Three Saintly Youths",      filename: "The Three Saintly Youths.png",            price: D2C_PRICE, category: "saints" },

  // PROPHETS & PATRIARCHS
  { id: "moses-archprophet",    name: "Moses the Archprophet",  filename: "Moses the Archprophet.png",       price: D2C_PRICE, category: "prophets" },
  { id: "daniel-prophet",       name: "Daniel the Prophet",     filename: "Daniel the Prophet.png",          price: D2C_PRICE, category: "prophets" },
  { id: "david-prophet",        name: "David the Prophet",      filename: "David the Prophet.png",           price: D2C_PRICE, category: "prophets" },
  { id: "jonah-prophet",        name: "Jonah the Prophet",      filename: "Jonah the Prophet.png",           price: D2C_PRICE, category: "prophets" },
  { id: "joseph-prophet",       name: "Joseph the Prophet",     filename: "Joseph the Prophet.png",          price: D2C_PRICE, category: "prophets" },
  { id: "abraham-isaac-jacob",  name: "Abraham, Isaac & Jacob", filename: "Abraham, Isaac, and Jacob.png",   price: D2C_PRICE, category: "prophets" },
  { id: "noah-ark",             name: "Noah & the Ark",         filename: "Noah and Ark.png",                price: D2C_PRICE, category: "prophets" },
  { id: "isaac-sacrifice",      name: "Sacrifice of Isaac",     filename: "Isaac Sacrifice.png",             price: D2C_PRICE, category: "prophets" },
  { id: "parting-red-sea",      name: "Parting of the Red Sea", filename: "Parting of the Red Sea.png",      price: D2C_PRICE, category: "prophets" },

  // SCENES
  { id: "holy-family",       name: "The Holy Family",         filename: "The Holy Family Working.png", price: D2C_PRICE, category: "scenes" },
  { id: "wedding-cana",      name: "The Wedding at Cana",     filename: "The Wedding at Cana.png",     price: D2C_PRICE, category: "scenes" },
  { id: "loaves-fish",       name: "5 Loaves & 2 Fish",       filename: "5 Loaves and 2 Fish.png",     price: D2C_PRICE, category: "scenes" },
  { id: "catching-fish",     name: "Catching the Fish",       filename: "Catching the fish.png",       price: D2C_PRICE, category: "scenes" },
  { id: "joseph-carpenter",  name: "St. Joseph the Carpenter", filename: "St. Joseph the Carpenter.png", price: D2C_PRICE, category: "scenes" },

  // HOLY WEEK — 23 scenes (packOnly unless noted)
  { id: "hwp-01", name: "Raising of Lazarus",         filename: "01 - Resurrection of Lazarus.png",           price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-02", name: "Entry into Jerusalem",        filename: "02 - Jesus Entry into Jerusalem.png",        price: D2C_PRICE, category: "holy-week" },
  { id: "hwp-03", name: "Driving Out the Merchants",  filename: "03 - Jesus drives out the merchants.png",    price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-04", name: "Cursing the Fig Tree",        filename: "04 - Cursing the Fig Tree.png",              price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-05", name: "Teaching in the Temple",      filename: "05 - Jesus teaching in the temple.png",      price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-06", name: "The Wise Virgins",            filename: "06 - Jesus and the wise virgins.png",        price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-07", name: "Anointing at Jesus' Feet",   filename: "07 - Anointing at Jesus_ feet.png",          price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-08", name: "Judas Receives Silver",       filename: "08 - Judas Receiving Silver.png",            price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-09", name: "Washing of the Feet",         filename: "09 - washing of the feet .png",              price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-10", name: "The Last Supper",             filename: "10 - The Last Supper.png",                   price: D2C_PRICE, category: "holy-week" },
  { id: "hwp-11", name: "Gethsemane",                  filename: "11 - Jesus praying in Gethsemane.png",       price: D2C_PRICE, category: "holy-week" },
  { id: "hwp-12", name: "Judas' Betrayal",             filename: "12 - Judas_ Betrayal.png",                   price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-13", name: "Before the High Priest",      filename: "13 - High Priest Judgement.png",             price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-14", name: "The Rooster Crows",           filename: "14 - Rooster Craw.png",                      price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-15", name: "The Scourging",               filename: "15 - Jesus_ Scourging.png",                  price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-16", name: "Pilate Washes His Hands",     filename: "16 - Pilate washes his hands.png",           price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-17", name: "Mocked by Romans",            filename: "17 - Laughed at By Romans.png",              price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-18", name: "Face on the Handkerchief",    filename: "18 - Face imprint on the handkerchief .png", price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-19", name: "The Crucifixion",             filename: "19 - Crucifixion (HWP).png",                 price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-20", name: "Descent from the Cross",      filename: "20 - Descent from the cross.png",            price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-21", name: "Tomb Burial",                 filename: "21 - Tomb Burial.png",                       price: D2C_PRICE, category: "holy-week",    packOnly: true },
  { id: "hwp-22", name: "Christ in Hades",             filename: "22 - Christ in Hades.png",                   price: D2C_PRICE, category: "holy-week" },
  { id: "hwp-23", name: "The Resurrection",            filename: "23 - Resurrection (HWP).png",                price: D2C_PRICE, category: "holy-week",    packOnly: true },

  // RESURRECTION PACK — 10 scenes (packOnly unless noted)
  { id: "rp-01", name: "Resurrection with Guards",      filename: "01 - Resurrection w_ guards (RP).png",  price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-02", name: "The Empty Tomb",                filename: "02 - Empty tomb w_soliders.png",         price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-03", name: "Mary Magdalene",                filename: "03 - Mary Magdalene.png",                price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-04", name: "The Myrrhbearers",              filename: "04 - Myrrhbearers.png",                  price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-05", name: "Doubting Thomas",               filename: "05 - Doubting Thomas.png",               price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-06", name: "The Emmaus Disciples",          filename: "06 - Emmuas Disciples.png",              price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-07", name: "Appearance in the Upper Room",  filename: "07 - Apperance in the Upper Room.png",   price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-08", name: "Breakfast at the Sea",          filename: "08 - Breakfast at Sea.png",              price: D2C_PRICE, category: "resurrection", packOnly: true },
  { id: "rp-09", name: "The Ascension",                 filename: "09 - Ascension.png",                     price: D2C_PRICE, category: "resurrection" },
  { id: "rp-10", name: "Pentecost",                     filename: "10 - Pentecost.png",                     price: D2C_PRICE, category: "resurrection" },
];
