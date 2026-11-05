import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type CSSProperties,
  type ReactNode,
} from "react";
import gsap from "gsap";
import type { BottleHandle } from "./BottleScene";
const BottleScene = lazy(() =>
  import("./BottleScene").then((m) => ({ default: m.BottleScene })),
);
import { catalog, copy, scents, type Lang, type ScentId } from "./catalog";
import {
  addItem,
  changeQuantity,
  normalizeCart,
  prices,
  subtotal,
  unitPrice,
  validSet,
  type CartItem,
  type Size,
} from "./cart";
import "./threeD.css";
const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`;
const money = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
const safeRead = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const initialLang = (): Lang => {
  const q = new URLSearchParams(location.search).get("lang");
  return q === "en" || q === "ru"
    ? q
    : safeRead("noct-preview-language") === "ru"
      ? "ru"
      : "en";
};
const initialCart = () => {
  try {
    return normalizeCart(JSON.parse(safeRead("noct-preview-cart-v1") || "[]"));
  } catch {
    return [];
  }
};
const words = {
  en: {
    hint: "Turn the bottle. Open the scent.",
    drag: "Drag to turn · touch the cap to lift",
    open: "Lift the cap",
    closeCap: "Return the cap",
    spray: "Spray",
    reset: "Reset view",
    left: "Turn left",
    right: "Turn right",
    notes: "Explore the notes",
    ready: "Three layers, one atmosphere.",
    ritual: "THE OPENING RITUAL",
    ritualA: "A gesture.",
    ritualB: "An atmosphere.",
    ritualText:
      "Lift the stone. Press once. The first impression gives way to something softer, then something that stays.",
    choose: "CHOOSE YOUR NIGHT",
    chooseA: "Make it",
    chooseB: "your own.",
    set: "The whole night, in miniature.",
    film: "A study in light",
    filmSub: "The original six-second NOCT film.",
    watch: "Watch the film",
    fallback: "The still view is ready. Explore every scent below.",
    intro: "AN OBJECT TO FEEL, A SCENT TO KEEP",
    notesHeading: ["First impression", "At its heart", "What remains"],
    noteDescriptions: [
      "A brief spark. The first notes rise into cool night air.",
      "The centre of the composition unfolds, close to the skin.",
      "A quiet trail, warm and slow. The part that stays with you.",
    ],
    preview: "INTERACTIVE STUDY / PREVIEW",
    close: "Close",
    empty: "Your bag is waiting for a little night.",
    back: "Return to the bottle",
    notesDirect: "All notes are available without the ritual.",
    add: "Add to bag",
    filmLabel: "NOCT — original product film",
  },
  ru: {
    hint: "Поверните флакон. Откройте аромат.",
    drag: "Потяните в сторону · нажмите на крышку",
    open: "Снять крышку",
    closeCap: "Вернуть крышку",
    spray: "Распылить",
    reset: "Сбросить ракурс",
    left: "Повернуть влево",
    right: "Повернуть вправо",
    notes: "Изучить ноты",
    ready: "Три слоя. Одна атмосфера.",
    ritual: "РИТУАЛ ЗНАКОМСТВА",
    ritualA: "Одно движение.",
    ritualB: "Целая атмосфера.",
    ritualText:
      "Снимите каменную крышку. Нажмите один раз. Первое впечатление сменится мягким сердцем, а затем — тем, что останется с вами.",
    choose: "ВЫБЕРИТЕ СВОЮ НОЧЬ",
    chooseA: "Пусть она станет",
    chooseB: "вашей.",
    set: "Вся ночь в миниатюре.",
    film: "Этюд о свете",
    filmSub: "Оригинальный шестисекундный фильм NOCT.",
    watch: "Смотреть фильм",
    fallback: "Статичный образ готов. Все ароматы доступны ниже.",
    intro: "ПРЕДМЕТ, КОТОРЫЙ ХОЧЕТСЯ ПОЧУВСТВОВАТЬ",
    notesHeading: ["Первое впечатление", "Сердце аромата", "Что остаётся"],
    noteDescriptions: [
      "Короткая искра. Первые ноты растворяются в прохладном ночном воздухе.",
      "Сердце композиции раскрывается медленно, близко к коже.",
      "Тихий, тёплый шлейф. Часть аромата, которая остаётся с вами.",
    ],
    preview: "ИНТЕРАКТИВНЫЙ ЭТЮД / ПРЕВЬЮ",
    close: "Закрыть",
    empty: "В корзине есть место для вашей ночи.",
    back: "Вернуться к флакону",
    notesDirect: "Все ноты доступны и без ритуала.",
    add: "В корзину",
    filmLabel: "NOCT — оригинальный предметный фильм",
  },
} as const;
type Modal = "cart" | "notes" | "film" | "menu" | null;
function Dialog({
  open,
  reduce,
  onClose,
  title,
  children,
}: {
  open: boolean;
  reduce: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    inner = useRef<HTMLDivElement>(null),
    focus = useRef<HTMLElement | null>(null),
    isOpen = useRef(open);
  isOpen.current = open;
  useLayoutEffect(() => {
    const d = dialog.current!,
      el = inner.current!;
    gsap.killTweensOf(el);
    if (open) {
      if (!d.open) {
        focus.current = document.activeElement as HTMLElement;
        d.showModal();
        gsap.set(el, { x: reduce ? 0 : 25, opacity: 0 });
      }
      document.body.style.overflow = "hidden";
      gsap.to(el, {
        x: 0,
        opacity: 1,
        duration: reduce ? 0 : 0.25,
        ease: "power3.out",
        overwrite: true,
      });
      d.querySelector<HTMLButtonElement>(".close")?.focus();
    } else if (d.open)
      gsap.to(el, {
        x: reduce ? 0 : 25,
        opacity: 0,
        duration: reduce ? 0 : 0.2,
        overwrite: true,
        onComplete: () => {
          if (isOpen.current) return;
          d.close();
          document.body.style.overflow = "";
          focus.current?.focus({ preventScroll: true });
        },
      });
    return () => {
      gsap.killTweensOf(el);
    };
  }, [open, reduce]);
  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );
  return (
    <dialog
      className="panel-dialog scene-dialog"
      ref={dialog}
      aria-labelledby="panel-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer" ref={inner}>
        <div className="panel-head">
          <span className="eyebrow">NOCT / PARFUMS DE NUIT</span>
          <button className="close" onClick={onClose} aria-label={title}>
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export default function App3D() {
  const [lang, setLang] = useState<Lang>(initialLang),
    [scent, setScent] = useState<ScentId>("ember"),
    [size, setSize] = useState<Size>(50),
    [cart, setCart] = useState<CartItem[]>(initialCart),
    [samples, setSamples] = useState<ScentId[]>([]),
    [capOpen, setCapOpen] = useState(false),
    [spraySerial, setSpraySerial] = useState(0),
    [notesReady, setNotesReady] = useState(false),
    [noteIndex, setNoteIndex] = useState(0),
    [modal, setModal] = useState<Modal>(null),
    [displayModal, setDisplayModal] = useState<Modal>(null),
    [checkout, setCheckout] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading"),
    [reduce, setReduce] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [storage, setStorage] = useState(true);
  const bottle = useRef<BottleHandle>(null),
    sprayTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    film = useRef<HTMLVideoElement>(null);
  const t = copy[lang],
    w = words[lang],
    p = catalog[scent],
    text = p[lang],
    count = cart.reduce((sum, x) => sum + x.quantity, 0),
    layers = [text.top, text.heart, text.base];
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const entrance = gsap.context(() => {
      gsap.from(".hero-editorial > *, .hero-choice, .preview-label", {
        opacity: 0,
        y: 18,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "opacity,transform",
      });
    });
    return () => entrance.revert();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "en"
        ? "NOCT — An object to feel"
        : "NOCT — Прикосновение к ночи";
    const u = new URL(location.href);
    u.searchParams.set("lang", lang);
    history.replaceState(null, "", u);
    try {
      localStorage.setItem("noct-preview-language", lang);
    } catch {
      setStorage(false);
    }
  }, [lang]);
  useEffect(() => {
    try {
      localStorage.setItem("noct-preview-cart-v1", JSON.stringify(cart));
    } catch {
      setStorage(false);
    }
  }, [cart]);
  useEffect(() => {
    if (modal) setDisplayModal(modal);
    if (modal !== "film") film.current?.pause();
  }, [modal]);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      fn = () => setReduce(q.matches);
    q.addEventListener("change", fn);
    return () => q.removeEventListener("change", fn);
  }, []);
  useEffect(
    () => () => {
      if (sprayTimer.current) clearTimeout(sprayTimer.current);
    },
    [],
  );
  function spray() {
    if (!capOpen) return;
    setSpraySerial((n) => n + 1);
    if (sprayTimer.current) clearTimeout(sprayTimer.current);
    sprayTimer.current = setTimeout(
      () => setNotesReady(true),
      reduce ? 0 : 420,
    );
  }
  function add(id: ScentId | "discovery", volume: Size | 2) {
    setCart((old) =>
      addItem(old, id, volume, id === "discovery" ? samples : undefined),
    );
    setCheckout(false);
    setModal("cart");
  }
  function go(id: string) {
    setModal(null);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
  }
  function openNote(i: number) {
    setNoteIndex(i);
    setModal("notes");
  }
  function selection(where: string) {
    return (
      <div className={`purchase-controls ${where}`}>
        <fieldset className="sizes">
          <legend>{t.volume}</legend>
          {([30, 50, 100] as Size[]).map((v) => (
            <button
              key={v}
              aria-pressed={v === size}
              onClick={() => setSize(v)}
            >
              {v} {lang === "ru" ? "мл" : "ml"}
            </button>
          ))}
        </fieldset>
        <button
          className={`primary ${where === "hero-order" ? "quick-add" : "add-button"}`}
          onClick={() => add(scent, size)}
        >
          {t.add}
          <span>{money(prices[size], lang)} ↗</span>
        </button>
        <p className="concept-price">{t.demoPrice}</p>
      </div>
    );
  }
  function anchor(id: string, small = false) {
    return (
      <div
        className={`scene-anchor ${small ? "small-anchor" : ""}`}
        data-bottle-anchor
        id={id}
      >
        <img
          className={`fallback-bottle tone-${scent}`}
          src={media(p.image)}
          alt=""
        />
        <div
          className="bottle-touch"
          role="img"
          tabIndex={0}
          aria-label={w.hint}
          aria-describedby={`${id}-hint`}
          aria-keyshortcuts="ArrowLeft ArrowRight Home"
          onPointerDown={(e) => bottle.current?.pointerDown(e)}
          onPointerMove={(e) => bottle.current?.pointerMove(e)}
          onPointerUp={(e) => bottle.current?.pointerUp(e)}
          onPointerCancel={() => bottle.current?.cancel()}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              bottle.current?.turn(e.key === "ArrowLeft" ? -0.4 : 0.4);
            } else if (e.key === "Home") {
              e.preventDefault();
              bottle.current?.reset();
            }
          }}
        />
        <div className="bottle-toolbar">
          <button
            aria-label={w.left}
            onClick={() => bottle.current?.turn(-0.4)}
            disabled={status === "fallback"}
          >
            ↶
          </button>
          <button
            className="cap-toggle"
            aria-pressed={capOpen}
            onClick={() => setCapOpen(!capOpen)}
          >
            {capOpen ? w.closeCap : w.open}
          </button>
          <button
            className="spray-button"
            aria-label={
              lang === "en" ? "Press the atomizer" : "Нажать на распылитель"
            }
            onClick={spray}
            disabled={!capOpen}
          >
            {w.spray}
          </button>
          <button
            aria-label={w.reset}
            onClick={() => bottle.current?.reset()}
            disabled={status === "fallback"}
          >
            ⟲
          </button>
        </div>
        <p id={`${id}-hint`} className="drag-hint">
          {status === "fallback" ? w.fallback : w.drag}
        </p>
      </div>
    );
  }
  return (
    <div
      className={`scene-page scene-lang-${lang}`}
      data-renderer={status}
      data-cap={capOpen ? "open" : "closed"}
      data-notes={notesReady ? "revealed" : "waiting"}
      style={{ "--accent": p.color } as CSSProperties}
    >
      <Suspense fallback={null}>
        <BottleScene
          ref={bottle}
          scent={scent}
          capOpen={capOpen}
          spraySerial={spraySerial}
          reduce={reduce}
          paused={!!modal}
          onCap={() => setCapOpen((v) => !v)}
          onSpray={spray}
          onStatus={setStatus}
        />
      </Suspense>
      <a className="skip-link" href="#collection">
        {t.collection}
      </a>
      <header className="header">
        <a className="logo" href="#top" aria-label="NOCT home">
          NOCT<span>PARFUMS DE NUIT</span>
        </a>
        <nav>
          <a href="#ritual">{lang === "en" ? "The ritual" : "Ритуал"}</a>
          <a href="#collection">{t.collection}</a>
          <a href="#discovery">{t.samples}</a>
        </nav>
        <div className="header-end">
          <button
            className="language"
            aria-label={
              lang === "en" ? "Switch to Russian" : "Switch to English"
            }
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
          >
            <span className={lang === "en" ? "chosen" : ""}>EN</span>/
            <span className={lang === "ru" ? "chosen" : ""}>RU</span>
          </button>
          <button
            className="bag-trigger"
            onClick={() => {
              setCheckout(false);
              setModal("cart");
            }}
          >
            {t.bag} ({count})
          </button>
          <button
            className="menu-trigger"
            aria-label={t.menu}
            onClick={() => setModal("menu")}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <main id="top">
        <section className="stage hero-stage" aria-labelledby="hero-title">
          <p className="preview-label eyebrow">{w.preview}</p>
          <div className="hero-editorial">
            <p className="eyebrow">{w.intro}</p>
            <h1 id="hero-title">
              <span>{t.heroA}</span>
              <span>
                {t.heroB} <em>{t.heroC}</em>
              </span>
            </h1>
            <p>{t.heroDescription}</p>
            <a className="text-button" href="#ritual">
              {w.hint}
              <span>↓</span>
            </a>
          </div>
          {anchor("hero-sculpture")}
          <div className="hero-choice">
            <p className="eyebrow">
              N° {p.number} / {text.family}
            </p>
            <h2>{p.name}</h2>
            <p className="current-mood">{text.mood}</p>
            <div className="hero-scents" aria-label={t.collection}>
              {scents.map((id) => (
                <button
                  key={id}
                  aria-pressed={id === scent}
                  onClick={() => setScent(id)}
                >
                  <small>{catalog[id].number}</small>
                  {catalog[id].name}
                </button>
              ))}
            </div>
            {selection("hero-order")}
            <button className="text-button" onClick={() => openNote(0)}>
              {w.notes}
              <span>＋</span>
            </button>
          </div>
          <div className="stage-foot">
            <span>
              {lang === "en" ? "01 / THE ENCOUNTER" : "01 / ЗНАКОМСТВО"}
            </span>
            <a href="#ritual">{t.scroll} ↓</a>
            <span>{t.concept}</span>
          </div>
        </section>
        <section
          className="stage ritual-stage"
          id="ritual"
          aria-labelledby="ritual-title"
        >
          {anchor("ritual-sculpture")}
          <div className="ritual-copy">
            <p className="eyebrow">02 / {w.ritual}</p>
            <h2 id="ritual-title">
              {w.ritualA}
              <br />
              <em>{w.ritualB}</em>
            </h2>
            <p>{w.ritualText}</p>
            <p
              className={`ritual-feedback ${notesReady ? "is-revealed" : ""}`}
              aria-live="polite"
            >
              {notesReady ? w.ready : w.notesDirect}
            </p>
            <div className={`note-layers ${notesReady ? "is-revealed" : ""}`}>
              {w.notesHeading.map((title, i) => (
                <button
                  key={i}
                  className="note-layer"
                  onClick={() => openNote(i)}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{layers[i]}</p>
                  </div>
                  <span>↗</span>
                </button>
              ))}
            </div>
          </div>
        </section>
        <section
          className="stage select-stage"
          id="collection"
          aria-labelledby="collection-title"
        >
          <div className="selection-heading">
            <p className="eyebrow">03 / {w.choose}</p>
            <h2 id="collection-title">
              {w.chooseA} <em>{w.chooseB}</em>
            </h2>
          </div>
          {anchor("selection-sculpture")}
          <div className="selection-info product-info">
            <div
              className="scene-tabs"
              role="tablist"
              aria-label={t.collection}
            >
              {scents.map((id) => (
                <button
                  role="tab"
                  key={id}
                  aria-selected={scent === id}
                  aria-controls="scent-description"
                  tabIndex={scent === id ? 0 : -1}
                  onClick={() => setScent(id)}
                  onKeyDown={(e) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    ) {
                      e.preventDefault();
                      const n =
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? 2
                            : (scents.indexOf(scent) +
                                (e.key === "ArrowRight" ? 1 : 2)) %
                              3;
                      setScent(scents[n]);
                      document.getElementById(`choose-${scents[n]}`)?.focus();
                    }
                  }}
                  id={`choose-${id}`}
                >
                  <span>{catalog[id].number}</span>
                  {catalog[id].name}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="scent-description"
              aria-labelledby={`choose-${scent}`}
            >
              <p className="eyebrow">NOCT / N° {p.number}</p>
              <h3>{p.name}</h3>
              <p className="scent-mood">{text.mood}</p>
              <p className="scent-description">{text.description}</p>
              <div className="note-chips">
                {text.notes.map((n, i) => (
                  <span key={n}>
                    <sup>0{i + 1}</sup>
                    {n}
                  </span>
                ))}
              </div>
              {selection("collection-order")}
              <button className="text-button" onClick={() => openNote(1)}>
                {t.details}
                <span>＋</span>
              </button>
            </div>
          </div>
        </section>
        <section
          className="stage discover-stage"
          id="discovery"
          aria-labelledby="discovery-title"
        >
          <div className="discovery-title">
            <p className="eyebrow">04 / {t.sampleTag}</p>
            <h2 id="discovery-title">{w.set}</h2>
            <p>{t.sampleText}</p>
            {anchor("discovery-sculpture", true)}
          </div>
          <div className="sample-builder">
            <div className="sample-count">
              <span>{t.samplePick}</span>
              <span>{samples.length} / 3</span>
            </div>
            <div className="sample-vials" aria-hidden="true">
              {scents.map((id, i) => (
                <div
                  key={id}
                  className={`vial ${samples.includes(id) ? "filled" : ""}`}
                  style={{ rotate: `${(i - 1) * 7}deg` }}
                >
                  <div className="vial-cap" />
                  <div className="vial-body">
                    <span>NOCT</span>
                    <small>
                      {catalog[id].number}
                      <br />
                      {catalog[id].name}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <div className="sample-options">
              {scents.map((id) => (
                <button
                  key={id}
                  aria-pressed={samples.includes(id)}
                  onClick={() =>
                    setSamples((old) =>
                      old.includes(id)
                        ? old.filter((x) => x !== id)
                        : [...old, id],
                    )
                  }
                >
                  <small>{catalog[id].number}</small>
                  {catalog[id].name}
                  <span>{samples.includes(id) ? "✓" : "＋"}</span>
                </button>
              ))}
            </div>
            <p className="sample-feedback" aria-live="polite">
              {validSet(samples) ? t.sampleDone : t.sampleLeft}
            </p>
            <button
              className="primary"
              disabled={!validSet(samples)}
              onClick={() => add("discovery", 2)}
            >
              {t.sampleAdd}
              <span>{money(18, lang)} ↗</span>
            </button>
          </div>
        </section>
        <section className="film-strip">
          <img src={media("noct-hero.webp")} loading="lazy" alt="" />
          <div>
            <p className="eyebrow">NOCT / FILM 001</p>
            <h2>{w.film}</h2>
            <p>{w.filmSub}</p>
            <button className="text-button" onClick={() => setModal("film")}>
              {w.watch}
              <span>▷</span>
            </button>
          </div>
        </section>
      </main>
      <footer>
        <a className="footer-logo" href="#top">
          NOCT
        </a>
        <div>
          <p>{t.footer}</p>
          <p>{t.fiction}</p>
        </div>
        <a href="https://seoshiro.github.io/" target="_blank" rel="noreferrer">
          {t.portfolio} ↗
        </a>
        <span>© 2026</span>
      </footer>
      <Dialog
        open={!!modal}
        reduce={reduce}
        onClose={() => setModal(null)}
        title={w.close}
      >
        {displayModal === "menu" && (
          <>
            <h2 id="panel-title">{t.menu}</h2>
            <div className="menu-links">
              {[
                ["ritual", lang === "en" ? "The ritual" : "Ритуал"],
                ["collection", t.collection],
                ["discovery", t.samples],
              ].map(([id, label], i) => (
                <button key={id} onClick={() => go(id)}>
                  <small>0{i + 1}</small>
                  {label}
                  <span>↗</span>
                </button>
              ))}
            </div>
          </>
        )}
        {displayModal === "notes" && (
          <>
            <p className="eyebrow">
              {p.name} / {w.notesHeading[noteIndex]}
            </p>
            <h2 id="panel-title">{w.notesHeading[noteIndex]}</h2>
            <img
              className="note-image"
              src={media(
                ["wood.webp", "stone.webp", "linen.webp"][
                  scents.indexOf(scent)
                ],
              )}
              alt={text.notes.join(", ")}
            />
            <p className="detail-story">{layers[noteIndex]}</p>
            <p className="note-narrative">{w.noteDescriptions[noteIndex]}</p>
            <div className="detail-notes">
              {w.notesHeading.map((label, i) => (
                <button
                  key={i}
                  aria-pressed={i === noteIndex}
                  onClick={() => setNoteIndex(i)}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <p className="eyebrow">{label}</p>
                    <p>{layers[i]}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="panel-note">{t.noteHint}</p>
            <button className="primary" onClick={() => setModal(null)}>
              {w.back}
              <span>↗</span>
            </button>
          </>
        )}
        {displayModal === "film" && (
          <>
            <h2 id="panel-title">{w.film}</h2>
            <video
              className="separate-film"
              ref={film}
              src={modal === "film" ? media("noct-film.mp4") : undefined}
              controls
              playsInline
              autoPlay
              preload="none"
              aria-label={w.filmLabel}
              poster={media("noct-hero.webp")}
            />
            <p className="panel-note">{w.filmSub}</p>
          </>
        )}
        {displayModal === "cart" && (
          <>
            <h2 id="panel-title">
              {checkout ? t.demoTitle : t.bag}
              <span className="cart-counter">{!checkout && `(${count})`}</span>
            </h2>
            {checkout ? (
              <div className="demo-complete">
                <span className="demo-symbol">N/</span>
                <p>{t.demoText}</p>
                <p className="eyebrow">{t.demoLabel}</p>
                <button className="primary" onClick={() => setCheckout(false)}>
                  {t.backBag}
                  <span>↗</span>
                </button>
                <button className="text-button" onClick={() => setModal(null)}>
                  {w.back}
                  <span>↗</span>
                </button>
              </div>
            ) : !cart.length ? (
              <div className="empty-cart">
                <h3>{w.empty}</h3>
                <button
                  className="primary"
                  onClick={() => {
                    go("collection");
                  }}
                >
                  {t.explore}
                  <span>↗</span>
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-thumb">
                        {item.scent === "discovery" ? (
                          <span className="set-mark">
                            01
                            <br />
                            02
                            <br />
                            03
                          </span>
                        ) : (
                          <img
                            src={media(catalog[item.scent].image)}
                            alt=""
                            className={`tone-${item.scent}`}
                          />
                        )}
                      </div>
                      <div className="cart-item-info">
                        <h3>
                          {item.scent === "discovery"
                            ? t.sampleName
                            : catalog[item.scent].name}
                        </h3>
                        <p>
                          {item.scent === "discovery"
                            ? t.sampleMeta
                            : `${t.concentration} · ${item.size} ${lang === "ru" ? "мл" : "ml"}`}
                        </p>
                        <div className="quantity">
                          <button
                            aria-label={`${t.decrease} ${item.id}`}
                            onClick={() =>
                              setCart((old) => changeQuantity(old, item.id, -1))
                            }
                          >
                            −
                          </button>
                          <span aria-label={t.quantity}>{item.quantity}</span>
                          <button
                            aria-label={`${t.increase} ${item.id}`}
                            disabled={item.quantity >= 99}
                            onClick={() =>
                              setCart((old) => changeQuantity(old, item.id, 1))
                            }
                          >
                            ＋
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-end">
                        <span>
                          {money(unitPrice(item) * item.quantity, lang)}
                        </span>
                        <button
                          aria-label={`${t.remove} ${item.scent}`}
                          onClick={() =>
                            setCart((old) =>
                              old.filter((x) => x.id !== item.id),
                            )
                          }
                        >
                          {t.remove}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="cart-summary">
                  <div>
                    <span>{t.total}</span>
                    <span data-testid="subtotal">
                      {money(subtotal(cart), lang)}
                    </span>
                  </div>
                  <p>{t.demoPrice}</p>
                  <button className="primary" onClick={() => setCheckout(true)}>
                    {t.checkout}
                    <span>↗</span>
                  </button>
                  <p>{t.demoHint}</p>
                </div>
              </>
            )}
            <p className="panel-note">{storage ? t.saved : t.storageError}</p>
          </>
        )}
      </Dialog>
    </div>
  );
}
