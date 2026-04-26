export type CategoryKey =
  | "all"
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
}

export const CATEGORY_LABELS: Record<Exclude<CategoryKey, "all">, string> = {
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

export const CATEGORY_ORDER: Exclude<CategoryKey, "all">[] = [
  "packs", "christ", "our-lady", "angels", "saints",
  "prophets", "scenes", "holy-week", "resurrection",
];

export const CATALOG: Sticker[] = [
  // PACKS
  { id: "holy-week-pack",    name: "Holy Week Pack",      filename: "Christ Passion Week.png", price: 10.00, category: "packs", isPack: true, packSize: 23 },
  { id: "resurrection-pack", name: "Resurrection Pack",   filename: "Resurrection.png",        price: 5.00,  category: "packs", isPack: true, packSize: 10 },

  // CHRIST
  { id: "pantokrator",     name: "Pantokrator",       filename: "Pantokrator.png",        price: 0.70, category: "christ" },
  { id: "good-shepherd",   name: "Good Shepherd",     filename: "Good Shepherd.png",      price: 0.70, category: "christ" },
  { id: "lover-children",  name: "Lover of Children", filename: "Lover of Children.png",  price: 0.70, category: "christ" },
  { id: "transfiguration", name: "Transfiguration",   filename: "Transfiguration.png",    price: 0.70, category: "christ" },
  { id: "crucifixion",     name: "The Crucifixion",   filename: "The Cruxifiction.png",   price: 0.70, category: "christ" },

  // OUR LADY
  { id: "ti-theotokos",   name: "Ti Theotokos",           filename: "Ti Theotokos.png",           price: 0.70, category: "our-lady" },
  { id: "mother-of-jesus", name: "Mother of Jesus Christ", filename: "Mother of Jesus Christ.png", price: 0.70, category: "our-lady" },

  // ANGELS
  { id: "archangel-michael",  name: "Archangel Michael",  filename: "Archangel Michael.png",  price: 0.70, category: "angels", isNew: true },
  { id: "archangel-gabriel",  name: "Archangel Gabriel",  filename: "Archangel Gabriel.png",  price: 0.70, category: "angels" },
  { id: "archangel-raphael",  name: "Archangel Raphael",  filename: "Archangel Raphael.png",  price: 0.70, category: "angels" },
  { id: "seven-archangels",   name: "Seven Archangels",   filename: "Seven Archangels.png",   price: 0.70, category: "angels" },

  // SAINTS — modern
  { id: "pope-shenouda-liturgy", name: "Pope Shenouda III — Liturgy", filename: "Pope Shenouda - Liturgy.png",    price: 0.70, category: "saints" },
  { id: "pope-shenouda-joy",     name: "Pope Shenouda III — Joy",     filename: "Pope Shenouda Laughing V2.png",  price: 0.70, category: "saints" },
  { id: "pope-kirillos",         name: "Pope Kyrillos VI",            filename: "Pope Kirillos.png",              price: 0.70, category: "saints" },
  { id: "habib-girgis",          name: "Archdeacon Habib Girgis",     filename: "Archdeacon Habib Girgis.png",    price: 0.70, category: "saints" },
  { id: "tamav-irini",           name: "Tamav Irini",                 filename: "Tamav Irini.png",                price: 0.70, category: "saints" },
  { id: "fr-mina-aboud",         name: "Fr. Mina Aboud",              filename: "Fr. Mina Aboud.png",             price: 0.70, category: "saints" },
  { id: "abouna-bishoy-kamel",   name: "Fr. Bishoy Kamel",            filename: "Abouna Bishoy Kamel.png",        price: 0.70, category: "saints" },
  { id: "abouna-feltaos",        name: "Abouna Philtaous",            filename: "Abouna Feltaos.png",             price: 0.70, category: "saints" },
  { id: "anba-wannas",           name: "Anba Youannis",               filename: "Anba Wannas.png",                price: 0.70, category: "saints" },
  { id: "saint-abraam",          name: "Bishop Abraam",               filename: "Saint Abraam.png",               price: 0.70, category: "saints" },
  // martyrs & monastics
  { id: "st-george",           name: "St. George",                     filename: "St. George.png",                          price: 0.70, category: "saints" },
  { id: "st-demiana",          name: "St. Demiana",                    filename: "St. Demiana.png",                         price: 0.70, category: "saints" },
  { id: "st-marina-nun",       name: "St. Marina the Nun",             filename: "St. Marina the Nun.png",                  price: 0.70, category: "saints" },
  { id: "st-marina-martyr",    name: "St. Marina the Martyr",          filename: "St. Marina the Marty and the Nun.png",    price: 0.70, category: "saints" },
  { id: "st-justina",          name: "St. Justina",                    filename: "St Justina.png",                          price: 0.70, category: "saints" },
  { id: "saint-abanoub",       name: "St. Abanoub",                    filename: "Saint Abanoub.png",                       price: 0.70, category: "saints" },
  { id: "saint-philopateer",   name: "St. Philopateer",                filename: "Saint Philopateer.png",                   price: 0.70, category: "saints" },
  { id: "martyrs-of-libya",    name: "Martyrs of Libya",               filename: "Martyrs of Libya.png",                   price: 0.70, category: "saints" },
  { id: "st-stephen",          name: "St. Stephen",                    filename: "St. Stephen.png",                         price: 0.70, category: "saints" },
  { id: "st-bishoy",           name: "St. Bishoy",                     filename: "Saint Bishoy.png",                        price: 0.70, category: "saints" },
  { id: "ava-antonios",        name: "St. Antony the Great",           filename: "Ava Antonios.png",                        price: 0.70, category: "saints" },
  { id: "ava-arsenious",       name: "St. Arsenius the Great",         filename: "Ava Arsenious.png",                       price: 0.70, category: "saints" },
  { id: "ava-ignatius",        name: "St. Ignatius",                   filename: "Ava Ignatius.png",                        price: 0.70, category: "saints" },
  { id: "saint-john-kame",     name: "St. John the Short",             filename: "Saint John Kame.png",                     price: 0.70, category: "saints" },
  { id: "saint-karas",         name: "St. Karas",                      filename: "Saint Karas.png",                         price: 0.70, category: "saints" },
  { id: "st-moses",            name: "St. Moses the Strong",           filename: "St Moses.png",                            price: 0.70, category: "saints" },
  { id: "st-paesa",            name: "St. Paesa",                      filename: "St Paesa.png",                            price: 0.70, category: "saints" },
  { id: "st-rewis",            name: "St. Rewis",                      filename: "St Rewis.png",                            price: 0.70, category: "saints" },
  { id: "aba-mina",            name: "St. Mina",                       filename: "Aba Mina.png",                            price: 0.70, category: "saints" },
  { id: "samuel-confessor",    name: "St. Samuel the Confessor",       filename: "Saint Samuel the Confessor.png",          price: 0.70, category: "saints" },
  { id: "st-zosima",           name: "St. Zosima",                     filename: "St. Zosima.png",                          price: 0.70, category: "saints" },
  { id: "st-mary-egypt",       name: "St. Mary of Egypt",              filename: "St. Mary of Egypt.png",                  price: 0.70, category: "saints" },
  { id: "st-pachom-tadros",    name: "Ss. Pachomius & Theodore",       filename: "St. Pachom and St. Tadros.png",           price: 0.70, category: "saints" },
  { id: "maximos-domadious",   name: "Ss. Maximos & Dometius",         filename: "Maximos and Domadious.png",               price: 0.70, category: "saints" },
  { id: "st-mark",             name: "St. Mark the Evangelist",        filename: "St. Mark.png",                            price: 0.70, category: "saints" },
  { id: "st-john-ev",          name: "St. John the Evangelist",        filename: "St. John.png",                            price: 0.70, category: "saints" },
  { id: "peter-paul",          name: "Ss. Peter & Paul",               filename: "Peter and Paul.png",                      price: 0.70, category: "saints" },
  { id: "four-evangelists",    name: "The Four Evangelists",           filename: "4 Gospel Authors.png",                    price: 0.70, category: "saints" },
  { id: "st-athanasius",       name: "St. Athanasius",                 filename: "St. Athanasius.png",                      price: 0.70, category: "saints" },
  { id: "three-saintly-youths", name: "The Three Saintly Youths",      filename: "The Three Saintly Youths.png",            price: 0.70, category: "saints" },

  // PROPHETS & PATRIARCHS
  { id: "moses-archprophet",    name: "Moses the Archprophet",  filename: "Moses the Archprophet.png",       price: 0.70, category: "prophets" },
  { id: "daniel-prophet",       name: "Daniel the Prophet",     filename: "Daniel the Prophet.png",          price: 0.70, category: "prophets" },
  { id: "david-prophet",        name: "David the Prophet",      filename: "David the Prophet.png",           price: 0.70, category: "prophets" },
  { id: "jonah-prophet",        name: "Jonah the Prophet",      filename: "Jonah the Prophet.png",           price: 0.70, category: "prophets" },
  { id: "joseph-prophet",       name: "Joseph the Prophet",     filename: "Joseph the Prophet.png",          price: 0.70, category: "prophets" },
  { id: "abraham-isaac-jacob",  name: "Abraham, Isaac & Jacob", filename: "Abraham, Isaac, and Jacob.png",   price: 0.70, category: "prophets" },
  { id: "noah-ark",             name: "Noah & the Ark",         filename: "Noah and Ark.png",                price: 0.70, category: "prophets" },
  { id: "isaac-sacrifice",      name: "Sacrifice of Isaac",     filename: "Isaac Sacrifice.png",             price: 0.70, category: "prophets" },
  { id: "parting-red-sea",      name: "Parting of the Red Sea", filename: "Parting of the Red Sea.png",      price: 0.70, category: "prophets" },

  // SCENES
  { id: "holy-family",       name: "The Holy Family",         filename: "The Holy Family Working.png", price: 0.70, category: "scenes" },
  { id: "wedding-cana",      name: "The Wedding at Cana",     filename: "The Wedding at Cana.png",     price: 0.70, category: "scenes" },
  { id: "loaves-fish",       name: "5 Loaves & 2 Fish",       filename: "5 Loaves and 2 Fish.png",     price: 0.70, category: "scenes" },
  { id: "catching-fish",     name: "Catching the Fish",       filename: "Catching the fish.png",       price: 0.70, category: "scenes" },
  { id: "joseph-carpenter",  name: "St. Joseph the Carpenter", filename: "St. Joseph the Carpenter.png", price: 0.70, category: "scenes" },

  // HOLY WEEK — 23 scenes
  { id: "hwp-01", name: "Raising of Lazarus",         filename: "01 - Resurrection of Lazarus.png",        price: 0.70, category: "holy-week" },
  { id: "hwp-02", name: "Entry into Jerusalem",        filename: "02 - Jesus Entry into Jerusalem.png",     price: 0.70, category: "holy-week" },
  { id: "hwp-03", name: "Driving Out the Merchants",  filename: "03 - Jesus drives out the merchants.png", price: 0.70, category: "holy-week" },
  { id: "hwp-04", name: "Cursing the Fig Tree",        filename: "04 - Cursing the Fig Tree.png",           price: 0.70, category: "holy-week" },
  { id: "hwp-05", name: "Teaching in the Temple",      filename: "05 - Jesus teaching in the temple.png",   price: 0.70, category: "holy-week" },
  { id: "hwp-06", name: "The Wise Virgins",            filename: "06 - Jesus and the wise virgins.png",     price: 0.70, category: "holy-week" },
  { id: "hwp-07", name: "Anointing at Jesus' Feet",   filename: "07 - Anointing at Jesus_ feet.png",       price: 0.70, category: "holy-week" },
  { id: "hwp-08", name: "Judas Receives Silver",       filename: "08 - Judas Receiving Silver.png",         price: 0.70, category: "holy-week" },
  { id: "hwp-09", name: "Washing of the Feet",         filename: "09 - washing of the feet .png",           price: 0.70, category: "holy-week" },
  { id: "hwp-10", name: "The Last Supper",             filename: "10 - The Last Supper.png",                price: 0.70, category: "holy-week" },
  { id: "hwp-11", name: "Gethsemane",                  filename: "11 - Jesus praying in Gethsemane.png",    price: 0.70, category: "holy-week" },
  { id: "hwp-12", name: "Judas' Betrayal",             filename: "12 - Judas_ Betrayal.png",                price: 0.70, category: "holy-week" },
  { id: "hwp-13", name: "Before the High Priest",      filename: "13 - High Priest Judgement.png",          price: 0.70, category: "holy-week" },
  { id: "hwp-14", name: "The Rooster Crows",           filename: "14 - Rooster Craw.png",                   price: 0.70, category: "holy-week" },
  { id: "hwp-15", name: "The Scourging",               filename: "15 - Jesus_ Scourging.png",               price: 0.70, category: "holy-week" },
  { id: "hwp-16", name: "Pilate Washes His Hands",     filename: "16 - Pilate washes his hands.png",        price: 0.70, category: "holy-week" },
  { id: "hwp-17", name: "Mocked by Romans",            filename: "17 - Laughed at By Romans.png",           price: 0.70, category: "holy-week" },
  { id: "hwp-18", name: "Face on the Handkerchief",    filename: "18 - Face imprint on the handkerchief .png", price: 0.70, category: "holy-week" },
  { id: "hwp-19", name: "The Crucifixion",             filename: "19 - Crucifixion (HWP).png",              price: 0.70, category: "holy-week" },
  { id: "hwp-20", name: "Descent from the Cross",      filename: "20 - Descent from the cross.png",         price: 0.70, category: "holy-week" },
  { id: "hwp-21", name: "Tomb Burial",                 filename: "21 - Tomb Burial.png",                    price: 0.70, category: "holy-week" },
  { id: "hwp-22", name: "Christ in Hades",             filename: "22 - Christ in Hades.png",                price: 0.70, category: "holy-week" },
  { id: "hwp-23", name: "The Resurrection",            filename: "23 - Resurrection (HWP).png",             price: 0.70, category: "holy-week" },

  // RESURRECTION PACK — 10 scenes
  { id: "rp-01", name: "Resurrection with Guards",      filename: "01 - Resurrection w_ guards (RP).png",  price: 0.70, category: "resurrection" },
  { id: "rp-02", name: "The Empty Tomb",                filename: "02 - Empty tomb w_soliders.png",         price: 0.70, category: "resurrection" },
  { id: "rp-03", name: "Mary Magdalene",                filename: "03 - Mary Magdalene.png",                price: 0.70, category: "resurrection" },
  { id: "rp-04", name: "The Myrrhbearers",              filename: "04 - Myrrhbearers.png",                  price: 0.70, category: "resurrection" },
  { id: "rp-05", name: "Doubting Thomas",               filename: "05 - Doubting Thomas.png",               price: 0.70, category: "resurrection" },
  { id: "rp-06", name: "The Emmaus Disciples",          filename: "06 - Emmuas Disciples.png",              price: 0.70, category: "resurrection" },
  { id: "rp-07", name: "Appearance in the Upper Room",  filename: "07 - Apperance in the Upper Room.png",   price: 0.70, category: "resurrection" },
  { id: "rp-08", name: "Breakfast at the Sea",          filename: "08 - Breakfast at Sea.png",              price: 0.70, category: "resurrection" },
  { id: "rp-09", name: "The Ascension",                 filename: "09 - Ascension.png",                     price: 0.70, category: "resurrection" },
  { id: "rp-10", name: "Pentecost",                     filename: "10 - Pentecost.png",                     price: 0.70, category: "resurrection" },
];
