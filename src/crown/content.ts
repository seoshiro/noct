import { catalog } from "../catalog";
export const composition = [
  {
    id: "geranium",
    en: {
      name: "Geranium",
      layer: "TOP NOTE",
      text: "Green, aromatic, quietly alive.",
    },
    ru: {
      name: "Герань",
      layer: "ВЕРХНЯЯ НОТА",
      text: "Прохладная зелень, лёгкая пряность.",
    },
  },
  {
    id: "tonka",
    en: {
      name: "Tonka bean",
      layer: "HEART",
      text: "A slow warmth. A softer kind of depth.",
    },
    ru: {
      name: "Бобы тонка",
      layer: "СЕРДЦЕ",
      text: "Тёплая глубина и тихая сладость.",
    },
  },
  {
    id: "sandalwood",
    en: {
      name: "Sandalwood",
      layer: "BASE",
      text: "Smooth wood. The trace that stays.",
    },
    ru: {
      name: "Сандал",
      layer: "БАЗА",
      text: "Мягкая древесина. Тепло на коже.",
    },
  },
] as const;
export const products = {
  ...catalog,
  rain: { ...catalog.rain, color: "#526e60" },
  veil: { ...catalog.veil, color: "#79647e" },
  ember: {
    ...catalog.ember,
    color: "#9b7e43",
    en: {
      ...catalog.ember.en,
      mood: "The warmth that remains.",
      family: "AROMATIC / WOODY",
      description:
        "Green geranium yields to the quiet sweetness of tonka bean. Sandalwood leaves a smooth, warm trace. An imagined composition for the hours that belong to you.",
      top: "Geranium",
      heart: "Tonka bean",
      base: "Sandalwood",
      notes: ["Geranium", "Tonka bean", "Sandalwood"],
      story:
        "The first cool breath. The slow return of warmth. The memory of skin.",
    },
    ru: {
      ...catalog.ember.ru,
      mood: "Тепло, которое остаётся.",
      family: "АРОМАТИЧЕСКИЙ / ДРЕВЕСНЫЙ",
      description:
        "Зелёная герань сменяется тихой сладостью бобов тонка. Сандал оставляет мягкий, тёплый след. Воображаемая композиция для часов, которые принадлежат вам.",
      top: "Герань",
      heart: "Бобы тонка",
      base: "Сандал",
      notes: ["Герань", "Бобы тонка", "Сандал"],
      story:
        "Первый прохладный вдох. Медленное возвращение тепла. Память о коже.",
    },
  },
};
export const words = {
  en: {
    composition: "The composition",
    collection: "The collection",
    allNotes: "Read every note",
    intro:
      "A trace of geranium. The warmth of tonka. Sandalwood, still on the skin.",
    scroll: "Scroll to reveal the scent",
    opening: "One moment. A whole atmosphere.",
    ending: "Make it yours.",
    choose: "Choose your night.",
    sampleHeading: "Three small beginnings.",
    filmTitle: "The first study",
    filmText: "The original NOCT film. An earlier expression of the object.",
    watch: "Watch the archive film",
    phases: [
      "THE OBJECT",
      "IN THE LIGHT",
      "THE RELEASE",
      "GERANIUM",
      "TONKA BEAN",
      "SANDALWOOD",
    ],
    noteTitle: "The composition, revealed.",
    back: "Return to the experience",
    concept: "Independent fragrance concept",
    reduced: "A quiet, sequential view of the composition.",
  },
  ru: {
    composition: "Композиция",
    collection: "Коллекция",
    allNotes: "Прочитать все ноты",
    intro: "Герань. Тепло бобов тонка. Сандал, который остаётся на коже.",
    scroll: "Прокрутите, чтобы раскрыть аромат",
    opening: "Одно движение. Целая атмосфера.",
    ending: "Пусть станет вашей.",
    choose: "Выберите свою ночь.",
    sampleHeading: "Три маленьких начала.",
    filmTitle: "Первый этюд",
    filmText: "Оригинальный фильм NOCT. Прежний образ флакона.",
    watch: "Смотреть архивный фильм",
    phases: [
      "ПРЕДМЕТ",
      "В СВЕТЕ",
      "РАСКРЫТИЕ",
      "ГЕРАНЬ",
      "БОБЫ ТОНКА",
      "САНДАЛ",
    ],
    noteTitle: "Композиция раскрывается.",
    back: "Вернуться к истории",
    concept: "Авторский парфюмерный концепт",
    reduced: "Спокойное последовательное знакомство с композицией.",
  },
} as const;
