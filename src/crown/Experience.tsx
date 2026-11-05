import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  lazy,
  Suspense,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { copy, scents, type Lang, type ScentId } from "../catalog";
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
} from "../cart";
import { composition, products, words } from "./content";
import { ease } from "./timeline";
import Drawer from "./Drawer";
import type { CrownHandle, CrownFrame, StudioView } from "./CrownScene";
import "./experience.css";
const CrownScene = lazy(() => import("./CrownScene"));
gsap.registerPlugin(ScrollTrigger);
const media = (name: string) => `${import.meta.env.BASE_URL}media/${name}`;
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const initialLanguage = (): Lang => {
  const q = new URLSearchParams(location.search).get("lang");
  return q === "en" || q === "ru"
    ? q
    : (read("noct-crown-language") || read("noct-preview-language")) === "ru"
      ? "ru"
      : "en";
};
const initialBag = () => {
  try {
    return normalizeCart(
      JSON.parse(
        read("noct-crown-cart-v1") || read("noct-preview-cart-v1") || "[]",
      ),
    );
  } catch {
    return [];
  }
};
const money = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
type Modal = "cart" | "composition" | "details" | "film" | "menu" | null;
const completeCollection = true;

export default function Experience() {
  const query = new URLSearchParams(location.search),
    inspection = query.has("studio"),
    view = (query.get("view") || "front") as StudioView;
  const [lang, setLang] = useState<Lang>(initialLanguage),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading"),
    [reduce, setReduce] = useState(
      () => matchMedia("(prefers-reduced-motion:reduce)").matches,
    ),
    [visible, setVisible] = useState(true),
    [phase, setPhase] = useState(0),
    [activeNote, setActiveNote] = useState(-1),
    [scent, setScent] = useState<ScentId>("ember"),
    [size, setSize] = useState<Size>(50),
    [bag, setBag] = useState<CartItem[]>(initialBag),
    [samples, setSamples] = useState<ScentId[]>([]),
    [modal, setModal] = useState<Modal>(null),
    [display, setDisplay] = useState<Modal>(null),
    [checkout, setCheckout] = useState(false),
    [storage, setStorage] = useState(true);
  const scene = useRef<CrownHandle>(null),
    story = useRef<HTMLElement>(null),
    hero = useRef<HTMLDivElement>(null),
    opening = useRef<HTMLDivElement>(null),
    ending = useRef<HTMLDivElement>(null),
    cards = useRef<(HTMLElement | null)[]>([]),
    paths = useRef<(SVGPathElement | null)[]>([]),
    dots = useRef<(SVGCircleElement | null)[]>([]),
    film = useRef<HTMLVideoElement>(null),
    progress = useRef(0),
    phaseRef = useRef(0),
    noteRef = useRef(-1);
  const t = copy[lang],
    w = words[lang],
    product = products[scent],
    text = product[lang],
    simple = reduce || status === "fallback",
    count = bag.reduce((n, x) => n + x.quantity, 0),
    available = completeCollection ? scents : (["ember"] as ScentId[]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "en"
        ? "NOCT — The night, revealed."
        : "NOCT — Ночь раскрывается.";
    const u = new URL(location.href);
    u.searchParams.set("lang", lang);
    history.replaceState(null, "", u);
    try {
      localStorage.setItem("noct-crown-language", lang);
    } catch {
      setStorage(false);
    }
    scene.current?.seek(progress.current);
  }, [lang]);
  useEffect(() => {
    try {
      localStorage.setItem("noct-crown-cart-v1", JSON.stringify(bag));
    } catch {
      setStorage(false);
    }
  }, [bag]);
  useEffect(() => {
    if (modal) setDisplay(modal);
    if (modal !== "film") film.current?.pause();
  }, [modal]);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion:reduce)"),
      update = () => setReduce(m.matches);
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (status === "ready") scene.current?.seek(progress.current);
  }, [status]);
  useEffect(() => {
    if (simple) {
      gsap.killTweensOf(".crown-header,.hero-text>*");
      if (hero.current) {
        hero.current.style.opacity = "1";
        hero.current.style.visibility = "visible";
      }
      gsap.set(".crown-header,.hero-text>*", {
        clearProps: "opacity,transform",
      });
    }
  }, [simple]);
  useLayoutEffect(() => {
    if (inspection || simple || !story.current) return;
    const el = story.current;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        progress.current = s.progress;
        scene.current?.seek(s.progress);
      },
    });
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0].isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    document.fonts.ready.then(() => trigger.refresh());
    return () => {
      trigger.kill();
      observer.disconnect();
    };
  }, [simple, inspection]);
  useLayoutEffect(() => {
    if (inspection || reduce) return;
    const ctx = gsap.context(() =>
      gsap.from(".crown-header,.hero-text>*", {
        opacity: 0,
        y: 12,
        stagger: 0.06,
        duration: 0.8,
        ease: "power3.out",
        clearProps: "opacity,transform",
      }),
    );
    return () => ctx.revert();
  }, []);
  const frame = useCallback((f: CrownFrame) => {
    if (hero.current) {
      hero.current.style.opacity = String(f.hero);
      hero.current.style.visibility = f.hero > 0.001 ? "visible" : "hidden";
    }
    if (opening.current) {
      const a =
        ease(
          innerWidth < 800 ? 0.295 : 0.2,
          innerWidth < 800 ? 0.32 : 0.245,
          f.progress,
        ) *
        (1 - ease(0.34, 0.405, f.progress));
      opening.current.style.opacity = String(a);
      opening.current.style.visibility = a > 0.001 ? "visible" : "hidden";
    }
    if (ending.current) {
      ending.current.style.opacity = String(f.ending);
      ending.current.style.visibility = f.ending > 0.001 ? "visible" : "hidden";
      ending.current.inert = f.ending < 0.5;
    }
    let next = -1;
    for (let i = 0; i < 3; i++) {
      const a = f.notes[i],
        card = cards.current[i],
        path = paths.current[i],
        dot = dots.current[i],
        point = f.anchors[i];
      if (a > 0.01) next = i;
      if (!card || !path || !dot || !point) continue;
      const photo = ease(0.35, 0.9, a);
      card.style.opacity = String(photo);
      card.style.visibility = photo > 0.001 ? "visible" : "hidden";
      const r = card.getBoundingClientRect(),
        endX = r.left + r.width / 2,
        endY = r.top - 16,
        length = Math.abs(point.y - endY) + Math.abs(point.x - endX);
      path.setAttribute(
        "d",
        `M ${point.x} ${point.y} L ${point.x} ${endY} L ${endX} ${endY}`,
      );
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length * (1 - ease(0, 0.65, a)));
      path.style.opacity = String(a);
      dot.setAttribute("cx", String(point.x));
      dot.setAttribute("cy", String(point.y));
      dot.style.opacity = String(a);
    }
    if (next !== noteRef.current) {
      noteRef.current = next;
      setActiveNote(next);
    }
    const n =
      f.progress < 0.11
        ? 0
        : f.progress < 0.235
          ? 1
          : f.progress < 0.425
            ? 2
            : f.progress < 0.59
              ? 3
              : f.progress < 0.74
                ? 4
                : 5;
    if (n !== phaseRef.current) {
      phaseRef.current = n;
      setPhase(n);
    }
  }, []);
  function jump(p: number) {
    if (simple) {
      document
        .getElementById("sequential-notes")
        ?.scrollIntoView({ behavior: "instant" });
      return;
    }
    const el = story.current;
    if (el)
      window.scrollTo({
        top: el.offsetTop + (el.offsetHeight - innerHeight) * p,
        behavior: reduce ? "instant" : "smooth",
      });
  }
  function add(id: ScentId | "discovery", volume: Size | 2) {
    setBag((old) =>
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
  function noteFigures(sequential = false) {
    return composition.map((n, i) => (
      <figure
        key={n.id}
        ref={(el) => {
          if (!sequential) cards.current[i] = el;
        }}
        className={sequential ? "sequential-note" : "story-note"}
        data-note={n.id}
        aria-hidden={sequential ? undefined : activeNote !== i}
      >
        <img
          src={media(`crown-${n.id}.webp`)}
          alt={n[lang].name}
          loading={sequential ? "lazy" : "eager"}
        />
        <figcaption>
          <p className="crown-kicker">{n[lang].layer}</p>
          <h3>{n[lang].name}</h3>
          <p>{n[lang].text}</p>
        </figcaption>
      </figure>
    ));
  }

  if (inspection)
    return (
      <div className="crown-page inspection-page" data-renderer={status}>
        <Suspense fallback={null}>
          <CrownScene ref={scene} inspection view={view} onStatus={setStatus} />
        </Suspense>
        {status !== "ready" && (
          <img
            className="crown-poster"
            src={media("crown-product-ember.webp")}
            alt=""
          />
        )}
      </div>
    );
  return (
    <div
      className="crown-page experience"
      data-renderer={status}
      data-simple={simple ? "true" : "false"}
      data-scent={scent}
      style={{ "--accent": product.color } as CSSProperties}
    >
      <a className="skip-link" href="#collection">
        {t.collection}
      </a>
      <header className="crown-header">
        <a href="#top" className="crown-logo" aria-label="NOCT">
          NOCT<span>PARFUMS DE NUIT</span>
        </a>
        <nav>
          <button onClick={() => setModal("composition")}>
            {w.composition}
          </button>
          <a href="#collection">{w.collection}</a>
          <a href="#discovery">{t.samples}</a>
        </nav>
        <div className="header-actions">
          <button
            className="crown-language"
            aria-label={
              lang === "en" ? "Switch to Russian" : "Switch to English"
            }
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
          >
            <span className={lang === "en" ? "selected" : ""}>EN</span> /{" "}
            <span className={lang === "ru" ? "selected" : ""}>RU</span>
          </button>
          <button
            className="crown-bag"
            data-cart-open
            onClick={() => {
              setCheckout(false);
              setModal("cart");
            }}
          >
            {t.bag} ({count})
          </button>
          <button
            className="crown-menu"
            aria-label={t.menu}
            onClick={() => setModal("menu")}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <main id="top">
        <section
          id="story"
          className="crown-story"
          ref={story}
          aria-label={
            lang === "en" ? "The unfolding composition" : "Раскрытие композиции"
          }
        >
          <div className="story-viewport">
            {!simple && (
              <Suspense fallback={null}>
                <CrownScene
                  ref={scene}
                  inspection={false}
                  view="front"
                  onStatus={setStatus}
                  onFrame={frame}
                  paused={!!modal}
                  visible={visible}
                />
              </Suspense>
            )}
            {status !== "ready" && (
              <img
                className="crown-poster story-poster"
                src={media("crown-product-ember.webp")}
                alt=""
              />
            )}
            <div className="crown-hero hero-text" ref={hero}>
              <p className="crown-kicker">NOCT / 01 — EMBER</p>
              <h1>
                {lang === "en" ? (
                  <>
                    The night
                    <br />
                    stays with you.
                  </>
                ) : (
                  <>
                    Ночь остаётся
                    <br />с тобой.
                  </>
                )}
              </h1>
              <p className="crown-intro">{w.intro}</p>
              <button
                className="crown-scroll"
                onClick={() =>
                  simple
                    ? document
                        .getElementById("sequential-notes")
                        ?.scrollIntoView({ behavior: "instant" })
                    : jump(0.2)
                }
              >
                {simple ? w.allNotes : w.scroll}
                <span>↓</span>
              </button>
            </div>
            {!simple && (
              <>
                <div className="story-opening" ref={opening}>
                  <p className="crown-kicker">03 / {w.phases[2]}</p>
                  <h2>{w.opening}</h2>
                </div>
                <div className="story-note-layer">{noteFigures()}</div>
                <svg
                  className="story-connectors"
                  width="100%"
                  height="100%"
                  aria-hidden="true"
                >
                  {composition.map((n, i) => (
                    <g key={n.id}>
                      <path
                        ref={(el) => {
                          paths.current[i] = el;
                        }}
                      />
                      <circle
                        r="2"
                        ref={(el) => {
                          dots.current[i] = el;
                        }}
                      />
                    </g>
                  ))}
                </svg>
                <div className="story-ending" ref={ending}>
                  <p className="crown-kicker">NOCT / 01</p>
                  <h2>{w.ending}</h2>
                  <a className="crown-primary" href="#collection">
                    {w.collection}
                    <span>↗</span>
                  </a>
                </div>
                <div className="story-position">
                  <span>{String(phase + 1).padStart(2, "0")} / 06</span>
                  <div>
                    {w.phases.map((name, i) => (
                      <button
                        key={name}
                        aria-label={name}
                        aria-current={phase === i ? "step" : undefined}
                        onClick={() =>
                          jump([0.035, 0.18, 0.34, 0.5, 0.665, 0.82][i])
                        }
                      >
                        {String(i + 1).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="sr-only" aria-live="polite">
                  {w.phases[phase]}
                </p>
              </>
            )}
          </div>
        </section>
        {simple && (
          <section
            className="sequential-notes"
            id="sequential-notes"
            aria-labelledby="sequential-title"
          >
            <p className="crown-kicker">NOCT / EMBER</p>
            <h2 id="sequential-title">{w.noteTitle}</h2>
            <p>{w.reduced}</p>
            <div>{noteFigures(true)}</div>
          </section>
        )}
        <section
          className="crown-collection"
          id="collection"
          aria-labelledby="collection-title"
        >
          <div className="collection-heading">
            <p className="crown-kicker">NOCT / COLLECTION</p>
            <h2 id="collection-title" tabIndex={-1}>
              {w.choose}
            </h2>
          </div>
          <div className="collection-visual">
            <img
              src={media(`crown-product-${scent}.webp`)}
              alt={
                lang === "en"
                  ? "NOCT black lacquer bottle with gold crown"
                  : "Чёрный лакированный NOCT с золотой короной"
              }
              loading="lazy"
            />
          </div>
          <div className="collection-info">
            <div
              className="collection-tabs"
              role="tablist"
              aria-label={t.collection}
            >
              {available.map((id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={scent === id}
                  aria-controls="product-panel"
                  id={`scent-${id}`}
                  tabIndex={scent === id ? 0 : -1}
                  onClick={() => setScent(id)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const next =
                        available[
                          (available.indexOf(scent) +
                            (e.key === "ArrowRight"
                              ? 1
                              : available.length - 1)) %
                            available.length
                        ];
                      setScent(next);
                      document.getElementById(`scent-${next}`)?.focus();
                    }
                  }}
                >
                  <span>{products[id].number}</span>
                  {products[id].name}
                </button>
              ))}
            </div>
            <div
              id="product-panel"
              role="tabpanel"
              aria-labelledby={`scent-${scent}`}
            >
              <p className="crown-kicker">
                N° {product.number} / {text.family}
              </p>
              <h3>{product.name}</h3>
              <p className="product-mood">{text.mood}</p>
              <p className="product-description">{text.description}</p>
              <div className="product-notes">
                {text.notes.map((n, i) => (
                  <span key={n}>
                    <sup>0{i + 1}</sup>
                    {n}
                  </span>
                ))}
              </div>
              <fieldset className="crown-sizes">
                <legend>{t.volume}</legend>
                {([30, 50, 100] as Size[]).map((v) => (
                  <button
                    key={v}
                    aria-pressed={size === v}
                    onClick={() => setSize(v)}
                  >
                    {v} {lang === "en" ? "ml" : "мл"}
                  </button>
                ))}
              </fieldset>
              <button
                className="crown-primary crown-add"
                onClick={() => add(scent, size)}
              >
                {t.add}
                <span>{money(prices[size], lang)} ↗</span>
              </button>
              <p className="small-note">{t.demoPrice}</p>
              <button
                className="crown-text-button"
                onClick={() => setModal("details")}
              >
                {t.details}
                <span>+</span>
              </button>
            </div>
          </div>
        </section>
        <section className="crown-discovery" id="discovery">
          <div>
            <p className="crown-kicker">NOCT / DISCOVERY</p>
            <h2>{w.sampleHeading}</h2>
            <p>{t.sampleText}</p>
          </div>
          <div className="discovery-builder">
            <div className="discovery-label">
              <span>{t.samplePick}</span>
              <span>{samples.length} / 3</span>
            </div>
            <div className="crown-vials" aria-hidden="true">
              {scents.map((id, i) => (
                <div
                  className={`crown-vial ${samples.includes(id) ? "filled" : ""}`}
                  key={id}
                  style={{ rotate: `${(i - 1) * 6}deg` }}
                >
                  <div />
                  <span>
                    NOCT
                    <small>
                      {products[id].number}
                      <br />
                      {products[id].name}
                    </small>
                  </span>
                </div>
              ))}
            </div>
            <div className="discovery-options">
              {scents.map((id) => (
                <button
                  key={id}
                  aria-pressed={samples.includes(id)}
                  onClick={() =>
                    setSamples((s) =>
                      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
                    )
                  }
                >
                  <small>{products[id].number}</small>
                  {products[id].name}
                  <span>{samples.includes(id) ? "✓" : "+"}</span>
                </button>
              ))}
            </div>
            <p className="discovery-feedback" aria-live="polite">
              {validSet(samples) ? t.sampleDone : t.sampleLeft}
            </p>
            <button
              className="crown-primary discovery-add"
              disabled={!validSet(samples)}
              onClick={() => add("discovery", 2)}
            >
              {t.sampleAdd}
              <span>{money(18, lang)} ↗</span>
            </button>
          </div>
        </section>
        <section className="crown-film">
          <img src={media("noct-hero.webp")} loading="lazy" alt="" />
          <div>
            <p className="crown-kicker">NOCT / ARCHIVE 001</p>
            <h2>{w.filmTitle}</h2>
            <p>{w.filmText}</p>
            <button
              className="crown-text-button"
              onClick={() => setModal("film")}
            >
              {w.watch}
              <span>▶</span>
            </button>
          </div>
        </section>
      </main>
      <footer className="crown-footer">
        <a href="#top" className="crown-logo">
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
      <Drawer
        open={!!modal}
        reduce={reduce}
        title={t.close}
        onClose={() => setModal(null)}
      >
        {display === "menu" && (
          <>
            <h2 id="drawer-title">{t.menu}</h2>
            <div className="drawer-menu">
              <button
                onClick={() => {
                  setModal(null);
                  jump(0.5);
                }}
              >
                01 / {w.composition}
              </button>
              <button onClick={() => go("collection")}>
                02 / {w.collection}
              </button>
              <button onClick={() => go("discovery")}>03 / {t.samples}</button>
              <button onClick={() => setModal("composition")}>
                {w.allNotes}
              </button>
            </div>
          </>
        )}
        {display === "composition" && (
          <>
            <h2 id="drawer-title">{w.noteTitle}</h2>
            <div className="drawer-composition">{noteFigures(true)}</div>
            <button className="crown-primary" onClick={() => setModal(null)}>
              {w.back}
              <span>↗</span>
            </button>
          </>
        )}
        {display === "details" && (
          <>
            <p className="crown-kicker">NOCT / N° {product.number}</p>
            <h2 id="drawer-title">{product.name}</h2>
            <p className="details-story">{text.story}</p>
            <p>{text.description}</p>
            <dl className="details-notes">
              {[t.top, t.heart, t.base].map((label, i) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{[text.top, text.heart, text.base][i]}</dd>
                </div>
              ))}
            </dl>
            {scent === "ember" && (
              <div className="detail-ingredients">
                {composition.map((n) => (
                  <img
                    key={n.id}
                    src={media(`crown-${n.id}.webp`)}
                    alt={n[lang].name}
                  />
                ))}
              </div>
            )}
            <p className="small-note">{t.noteHint}</p>
            <button className="crown-primary" onClick={() => setModal(null)}>
              {w.back}
              <span>↗</span>
            </button>
          </>
        )}
        {display === "film" && (
          <>
            <h2 id="drawer-title">{w.filmTitle}</h2>
            <video
              ref={film}
              className="archive-video"
              src={modal === "film" ? media("noct-film.mp4") : undefined}
              controls
              playsInline
              autoPlay
              preload="none"
              poster={media("noct-hero.webp")}
            />
            <p className="small-note">{w.filmText}</p>
          </>
        )}
        {display === "cart" && (
          <>
            <h2 id="drawer-title">
              {checkout ? t.demoTitle : t.bag}
              {!checkout && <span> ({count})</span>}
            </h2>
            {checkout ? (
              <div className="crown-demo">
                <span>N/</span>
                <p>{t.demoText}</p>
                <p className="crown-kicker">{t.demoLabel}</p>
                <button
                  className="crown-primary"
                  onClick={() => setCheckout(false)}
                >
                  {t.backBag}
                  <span>↗</span>
                </button>
                <button
                  className="crown-text-button"
                  onClick={() => setModal(null)}
                >
                  {w.back}
                  <span>↗</span>
                </button>
              </div>
            ) : !bag.length ? (
              <div className="crown-empty">
                <p>{t.emptyText}</p>
                <button
                  className="crown-primary"
                  onClick={() => go("collection")}
                >
                  {t.explore}
                  <span>↗</span>
                </button>
              </div>
            ) : (
              <>
                <div className="crown-cart-items">
                  {bag.map((item) => (
                    <article className="crown-cart-item" key={item.id}>
                      <div className="cart-image">
                        {item.scent === "discovery" ? (
                          <span>
                            01
                            <br />
                            02
                            <br />
                            03
                          </span>
                        ) : (
                          <img
                            src={media(`crown-product-${item.scent}.webp`)}
                            alt=""
                          />
                        )}
                      </div>
                      <div className="cart-line-info">
                        <h3>
                          {item.scent === "discovery"
                            ? t.sampleName
                            : products[item.scent].name}
                        </h3>
                        <p>
                          {item.scent === "discovery"
                            ? t.sampleMeta
                            : `${t.concentration} / ${item.size} ${lang === "en" ? "ml" : "мл"}`}
                        </p>
                        <div className="crown-quantity">
                          <button
                            aria-label={`${t.decrease} ${item.id}`}
                            onClick={() =>
                              setBag((b) => changeQuantity(b, item.id, -1))
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={`${t.increase} ${item.id}`}
                            disabled={item.quantity >= 99}
                            onClick={() =>
                              setBag((b) => changeQuantity(b, item.id, 1))
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="cart-line-end">
                        <span>
                          {money(unitPrice(item) * item.quantity, lang)}
                        </span>
                        <button
                          aria-label={`${t.remove} ${item.id}`}
                          onClick={() =>
                            setBag((b) => b.filter((x) => x.id !== item.id))
                          }
                        >
                          {t.remove}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="crown-cart-total">
                  <div>
                    <span>{t.total}</span>
                    <span data-testid="subtotal">
                      {money(subtotal(bag), lang)}
                    </span>
                  </div>
                  <p className="small-note">{t.demoPrice}</p>
                  <button
                    className="crown-primary checkout-demo"
                    onClick={() => setCheckout(true)}
                  >
                    {t.checkout}
                    <span>↗</span>
                  </button>
                  <p className="small-note">{t.demoHint}</p>
                </div>
              </>
            )}
            <p className="small-note storage-note">
              {storage ? t.saved : t.storageError}
            </p>
          </>
        )}
      </Drawer>
    </div>
  );
}
