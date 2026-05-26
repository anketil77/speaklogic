// src/dialog/components/FontPicker.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// ─── Probe list ───────────────────────────────────────────────────────────────
const FONT_PROBE_LIST: string[] = [
  // Windows / Office
  "Agency FB", "Algerian", "Arial", "Arial Black", "Arial Narrow", "Arial Nova",
  "Arial Rounded MT Bold", "Bahnschrift", "Bahnschrift Condensed", "Bahnschrift Light",
  "Bahnschrift Light Condensed", "Bahnschrift Light SemiCondensed",
  "Bahnschrift SemiBold", "Bahnschrift SemiBold Condensed", "Bahnschrift SemiCondensed",
  "Bahnschrift SemiLight", "Baskerville Old Face", "Bauhaus 93", "Bell MT",
  "Berlin Sans FB", "Berlin Sans FB Demi", "Bernard MT Condensed", "Blackadder ITC",
  "Bodoni MT", "Bodoni MT Black", "Bodoni MT Condensed", "Bodoni MT Poster Compressed",
  "Book Antiqua", "Bookman Old Style", "Bookshelf Symbol 7", "Bradley Hand ITC",
  "Britannic Bold", "Broadway", "Brush Script MT", "Calibri", "Calibri Light",
  "Californian FB", "Calisto MT", "Cambria", "Cambria Math", "Candara", "Candara Light",
  "Castellar", "Centaur", "Century", "Century Gothic", "Century Schoolbook", "Chiller",
  "Colonna MT", "Comic Sans MS", "Consolas", "Constantia", "Cooper Black",
  "Copperplate Gothic Bold", "Copperplate Gothic Light", "Corbel", "Corbel Light",
  "Courier New", "Curlz MT", "Dubai", "Dubai Light", "Dubai Medium", "Ebrima",
  "Edwardian Script ITC", "Elephant", "Engravers MT", "Eras Bold ITC", "Eras Demi ITC",
  "Eras Light ITC", "Eras Medium ITC", "Felix Titling", "Footlight MT Light", "Forte",
  "Franklin Gothic Book", "Franklin Gothic Demi", "Franklin Gothic Demi Cond",
  "Franklin Gothic Heavy", "Franklin Gothic Medium", "Franklin Gothic Medium Cond",
  "Freestyle Script", "French Script MT", "Gabriola", "Gadugi", "Garamond", "Georgia",
  "Gill Sans MT", "Gill Sans MT Condensed", "Gill Sans MT Ext Condensed Bold",
  "Gill Sans Ultra Bold", "Gill Sans Ultra Bold Condensed",
  "Gloucester MT Extra Condensed", "Goudy Old Style", "Goudy Stout", "Haettenschweiler",
  "Harlow Solid Italic", "Harrington", "High Tower Text", "Impact", "Imprint MT Shadow",
  "Informal Roman", "Ink Free", "Javanese Text", "Jokerman", "Juice ITC", "Kristen ITC",
  "Kunstler Script", "Leelawadee", "Leelawadee UI", "Leelawadee UI Semilight",
  "Lucida Bright", "Lucida Calligraphy", "Lucida Console", "Lucida Fax",
  "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter", "Lucida Sans Unicode",
  "Magneto", "Maiandra GD", "Malgun Gothic", "Malgun Gothic Semilight",
  "Matura MT Script Capitals", "Meiryo", "Meiryo UI", "Microsoft Himalaya",
  "Microsoft JhengHei", "Microsoft JhengHei Light", "Microsoft JhengHei UI",
  "Microsoft JhengHei UI Light", "Microsoft New Tai Lue", "Microsoft PhagsPa",
  "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft YaHei Light",
  "Microsoft YaHei UI", "Microsoft YaHei UI Light", "Microsoft Yi Baiti",
  "MingLiU_HKSCS-ExtB", "MingLiU-ExtB", "Mistral", "Modern No. 20", "Mongolian Baiti",
  "Monotype Corsiva", "MS Gothic", "MS Mincho", "MS PGothic", "MS PMincho",
  "MS Reference Sans Serif", "MS Reference Specialty", "MS UI Gothic", "MV Boli",
  "Myanmar Text", "Niagara Engraved", "Niagara Solid", "Nirmala UI",
  "Nirmala UI Semilight", "NSimSun", "OCR A Extended", "Old English Text MT", "Onyx",
  "Palatino Linotype", "Papyrus", "Parchment", "Perpetua", "Perpetua Titling MT",
  "Playbill", "PMingLiU-ExtB", "Poor Richard", "Pristina", "Rage Italic", "Ravie",
  "Rockwell", "Rockwell Condensed", "Rockwell Extra Bold", "Script MT Bold",
  "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Black",
  "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Light", "Segoe UI Semibold",
  "Segoe UI Semilight", "Segoe UI Symbol", "Segoe UI Variable", "ShowCard Gothic",
  "SimSun", "SimSun-ExtB", "Sitka Banner", "Sitka Display", "Sitka Heading",
  "Sitka Small", "Sitka Subheading", "Sitka Text", "Snap ITC", "Stencil", "Sylfaen",
  "Symbol", "Tahoma", "Tempus Sans ITC", "Times New Roman", "Trebuchet MS",
  "Tw Cen MT", "Tw Cen MT Condensed", "Tw Cen MT Condensed Extra Bold", "Verdana",
  "Viner Hand ITC", "Vivaldi", "Vladimir Script", "Webdings", "Wide Latin",
  "Wingdings", "Wingdings 2", "Wingdings 3", "Yu Gothic", "Yu Gothic Light",
  "Yu Gothic Medium", "Yu Gothic UI", "Yu Gothic UI Light", "Yu Gothic UI Regular",
  "Yu Gothic UI Semibold", "Yu Gothic UI Semilight",
  // Linux / cross-platform
  "Cantarell", "DejaVu Sans", "DejaVu Sans Condensed", "DejaVu Sans Mono",
  "DejaVu Serif", "DejaVu Serif Condensed", "Droid Sans", "Droid Sans Mono",
  "Droid Serif", "FreeMono", "FreeSans", "FreeSerif", "Liberation Mono",
  "Liberation Sans", "Liberation Sans Narrow", "Liberation Serif", "Linux Libertine",
  "Linux Libertine Display", "Noto Mono", "Noto Sans", "Noto Sans Display",
  "Noto Serif", "Open Sans", "Roboto", "Roboto Condensed", "Roboto Light",
  "Roboto Medium", "Roboto Mono", "Roboto Thin", "Ubuntu", "Ubuntu Condensed",
  "Ubuntu Light", "Ubuntu Medium", "Ubuntu Mono",
];

// ─── Canvas font detection ────────────────────────────────────────────────────

let detectedFontsCache: string[] | null = null;
let detectionPromise: Promise<string[]> | null = null;

function detectAvailableFonts(): Promise<string[]> {
  if (detectedFontsCache !== null) return Promise.resolve(detectedFontsCache);
  if (detectionPromise !== null) return detectionPromise;

  detectionPromise = new Promise<string[]>((resolve) => {
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        detectedFontsCache = [...FONT_PROBE_LIST].sort();
        resolve(detectedFontsCache);
        return;
      }
      const sample = "mmmmmmmmmmlli";
      const size = "72px";
      ctx.font = `${size} monospace`;
      const monoW = ctx.measureText(sample).width;
      ctx.font = `${size} serif`;
      const serifW = ctx.measureText(sample).width;
      const available: string[] = [];
      for (const font of FONT_PROBE_LIST) {
        ctx.font = `${size} '${font}', monospace`;
        const w1 = ctx.measureText(sample).width;
        ctx.font = `${size} '${font}', serif`;
        const w2 = ctx.measureText(sample).width;
        if (w1 !== monoW && w2 !== serifW) available.push(font);
      }
      detectedFontsCache = available.sort();
      resolve(detectedFontsCache);
    }, 0);
  });

  return detectionPromise;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface FontPickerProps {
  /** Currently applied font name — shown as input placeholder and highlighted in the list. */
  value: string;
  /** Called when a font is chosen. Does NOT close the outer panel. */
  onChange: (name: string) => void;
  /** Called when Escape is pressed while the list is already closed — closes the outer panel. */
  onClose: () => void;
}

export function FontPicker({ value, onChange, onClose }: FontPickerProps) {
  const [fontList, setFontList] = useState<string[]>(detectedFontsCache ?? []);
  const [loading, setLoading] = useState(detectedFontsCache === null);
  // Input starts empty → all fonts shown; current font is just highlighted.
  const [inputText, setInputText] = useState("");
  const [highlighted, setHighlighted] = useState(value);
  // The dropdown list starts open when the panel first appears.
  const [listOpen, setListOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Run detection once; use cache on subsequent opens.
  useEffect(() => {
    if (detectedFontsCache !== null) {
      setFontList(detectedFontsCache);
      setLoading(false);
      return;
    }
    detectAvailableFonts().then((fonts) => {
      setFontList(fonts);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the input after mount.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close the dropdown list when the user clicks OUTSIDE the picker container
  // (but possibly still inside the outer font panel). Uses capture so it fires
  // before any stopPropagation inside child components.
  useEffect(() => {
    if (!listOpen) return undefined;
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setListOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [listOpen]);

  const filtered = useMemo(() => {
    const q = inputText.toLowerCase().trim();
    if (!q) return fontList;
    return fontList.filter((f) => f.toLowerCase().includes(q));
  }, [inputText, fontList]);

  const safeHighlighted =
    filtered.includes(highlighted) ? highlighted : (filtered[0] ?? "");

  // Scroll to the current font when the list becomes visible.
  useEffect(() => {
    if (!listOpen || loading || !listRef.current) return;
    const idx = filtered.indexOf(value);
    if (idx >= 0) {
      const child = listRef.current.children[idx] as HTMLElement | undefined;
      child?.scrollIntoView({ block: "center" });
    }
  }, [listOpen, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  function scrollRowIntoView(idx: number) {
    const child = listRef.current?.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (listOpen) {
        setListOpen(false);
      } else {
        onClose(); // Close the outer panel.
      }
      return;
    }
    if (!listOpen) {
      if (e.key === "ArrowDown") { setListOpen(true); }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (safeHighlighted) {
        onChange(safeHighlighted);
        setInputText("");
        setListOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const idx = filtered.indexOf(safeHighlighted);
      const next =
        e.key === "ArrowDown"
          ? Math.min(idx + 1, filtered.length - 1)
          : Math.max(idx - 1, 0);
      setHighlighted(filtered[next] ?? safeHighlighted);
      scrollRowIntoView(next);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setInputText(text);
    setListOpen(true);
    const q = text.toLowerCase().trim();
    const newFiltered = !q ? fontList : fontList.filter((f) => f.toLowerCase().includes(q));
    setHighlighted(newFiltered[0] ?? "");
  }

  function handleFontSelect(font: string) {
    onChange(font);
    setInputText("");
    setHighlighted(font);
    setListOpen(false);
  }

  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, position: "relative" }}>
      <input
        ref={inputRef}
        value={inputText}
        placeholder={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setListOpen(true)}
        style={{
          width: "100%",
          height: "28px",
          background: "#FFFFFF",
          border: "1px solid #C7C7C7",
          borderRadius: listOpen ? "3px 3px 0 0" : "3px",
          padding: "0 9px",
          fontSize: "11.3px",
          fontFamily: "inherit",
          color: "#1B1B1B",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {listOpen && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "28px",
            left: 0,
            // Wide enough to show full font names; doesn't overflow the dialog.
            width: "220px",
            maxHeight: "180px",
            overflowY: "auto",
            border: "1px solid #C7C7C7",
            borderTop: "1px solid #E0E0E0",
            borderRadius: "0 0 3px 3px",
            background: "#FFFFFF",
            // Must sit above B/I/U/S and colour swatches inside the same panel.
            zIndex: 50,
            boxShadow: "0 4px 8px rgba(0,0,0,0.10)",
          }}
        >
          {loading && (
            <div style={{ padding: "8px 9px", fontSize: "11px", color: "#767676", userSelect: "none" }}>
              Detecting fonts…
            </div>
          )}

          {!loading && filtered.map((font) => (
            <div
              key={font}
              onMouseDown={(e) => {
                // preventDefault keeps the editor's savedRange intact.
                e.preventDefault();
                handleFontSelect(font);
              }}
              onMouseEnter={() => setHighlighted(font)}
              style={{
                padding: "3px 9px",
                fontSize: "13px",
                lineHeight: "20px",
                fontFamily: `'${font}', sans-serif`,
                cursor: "pointer",
                background: font === safeHighlighted ? "#EFF6FC" : "transparent",
                color: "#1B1B1B",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                userSelect: "none",
              }}
            >
              {font}
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "6px 9px", fontSize: "11px", color: "#767676", userSelect: "none" }}>
              No fonts match
            </div>
          )}
        </div>
      )}
    </div>
  );
}
