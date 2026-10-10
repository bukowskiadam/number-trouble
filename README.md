# Number Trouble

MVP gry w dodawanie i odejmowanie dla dzieci. Oceń spadające równanie
za pomocą ruchomych przycisków ✓ i ✗. Trafna ocena daje punkty, a błąd lub brak
odpowiedzi zapełnia jedno z ośmiu miejsc na planszy.

## Uruchomienie

Wymagany Node.js 22.12+ (zweryfikowano na 24.13) i npm.

```sh
cd number-trouble
npm ci
npm run dev
```

Vite poda adres lokalny. Projekt jest samodzielny: katalog `czytanki` nie jest
potrzebny do uruchomienia, budowania ani testów.

## Wersja produkcyjna i offline

```sh
npm run build
npm run preview
```

Otwórz adres podany przez Vite. Poczekaj na **„Gotowe do gry offline”**, zanim
odłączysz sieć. Pamięć obejmuje oba języki, fonty, ikony i cały kod. Dźwięki są
generowane lokalnie przez Web Audio. Serwer deweloperski nie instaluje service workera.

Instalację umożliwia przycisk „Zainstaluj grę” albo menu przeglądarki. Na iOS użyj
Safari → Udostępnij → Dodaj do ekranu głównego. PWA wymaga HTTPS lub localhost.
Zwykły HTTP przez adres IP w sieci lokalnej pozwala sprawdzić grę, ale nie pełne PWA.

Do publikacji wystarcza zawartość `dist/` na hostingu statycznym. Względne adresy
obsługują katalog główny i podścieżkę, np. `/number-trouble/` (z końcowym ukośnikiem).
Pliku `sw.js` nie należy długotrwale buforować po stronie HTTP. Nowy build otrzymuje
nowy hash pamięci; aktualizacja czeka na zamknięcie starych kart lub wybranie
przycisku odświeżenia poza aktywną partią. Profile i rekordy pozostają w localStorage.

## GitHub Pages

Adres publikacji: [Number Trouble](https://bukowskiadam.github.io/number-trouble/).

Workflow `.github/workflows/deploy.yml` uruchamia się po każdym pushu do `master`
i ręcznie z zakładki Actions, tak samo jak w Czytankach. Na Node.js 24 wykonuje
`npm ci`, kontrolę formatowania, testy jednostkowe, build oraz testy Playwright
produkcyjnej aplikacji, a potem publikuje `dist/` oficjalnymi akcjami GitHub Pages.
Uprawnienia publikacji są ograniczone do zadania deploy; nie potrzeba osobnego tokenu.

W **Settings → Pages → Source** wybierz **GitHub Actions**. Build pobiera ścieżkę
z metadanych Pages przez `VITE_BASE_PATH`; manifest i pamięć offline pozostają
wewnątrz `/number-trouble/`. Lokalnie domyślne adresy pozostają względne.

Sprawdzenie tej samej konfiguracji przed publikacją:

```sh
VITE_BASE_PATH=/number-trouble/ npm run build
npm run test:e2e
```

## Zakres

- Cztery poziomy: suma do 10; dwa składniki 0–10; dodawanie i odejmowanie 0–10
  z nieujemnym wynikiem; suma do 100.
- Trzy niezależne tempa: żółw (0,4), koń (0,8) i gepard (1,2 warstwy/s).
  Przyspieszanie podczas aktywnego spadania: 2× po 120 s, limit 3× po 240 s.
- Jedna kolumna, osiem klocków, seria punktów 10, 11, 12… i osobny licznik streak.
- Korekty przez 2 sekundy, również po pominięciu ostatniego równania.
- Mysz, dotyk, klawiatura: ← / T oznacza ✓, → / F oznacza ✗; spacja / Escape pauzuje.
- Pauza ręczna i automatyczna po ukryciu karty; powrót wymaga wznowienia.
- Profile z inicjałami, edycją nazwy, potwierdzanym resetem i usuwaniem oraz
  12 osobnymi rekordami na dziecko. Dane: `number-trouble-profiles-v1`.
- Polski i angielski, wyciszenie przypisane do profilu, niezależne od Czytanek zasoby PWA.
- Błędy zapisu nie blokują gry; aplikacja pokazuje informację o pracy tylko w pamięci.

## Weryfikacja

```sh
npm test
npx playwright install chromium
npm run build
npm run test:e2e
npm run format:check
```

Playwright uruchamia produkcyjny build pod `/number-trouble/` na porcie 4175.
Testy obejmują także wyłączenie sieci i ponowne otwarcie aplikacji. Ustawienie
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` pozwala opcjonalnie użyć własnego Chromium.
Ikony PNG są gotowe w `public/`; `npm run icons` odtwarza je z własnego SVG za pomocą
Playwright. Generowanie ikon nie jest potrzebne do zwykłego buildu.

Wyniki i ograniczenia: [QA.md](docs/QA.md). Próby z dziećmi oraz instalacja na
rzeczywistym telefonie/tablecie pozostają do wykonania; emulacja nie zastępuje tych prób.

## Wersja i historia zmian

Stopka każdego widoku menu pokazuje wersję z `package.json` i otwiera historię zmian
w języku profilu. Opisy są częścią aplikacji i działają offline. Po aktualizacji do
nowej wersji okno nowości pojawia się raz, z uwzględnieniem pominiętych wydań.
Pierwsze uruchomienie, ponowne uruchomienie tej samej wersji i rollback nie otwierają okna.
Wersja ostatniego uruchomienia jest wspólna dla profili i nie zmienia ich rekordów.

Angielski [changelog](CHANGELOG.md) zawiera sekcję roboczą `Unreleased`; historia
w aplikacji zawiera tylko wydane wersje. Zwykłe zmiany nie podbijają numeru ani nie
zamykają changelogu. Zasady SemVer, przygotowanie wydania, tagowanie i publikację
opisuje [procedura wydania](docs/RELEASE.md).

## Struktura i dokumentacja

- `src/game/` — generator i silnik czasu, punktacji, korekt i lądowania.
- `src/profiles.ts` — walidacja, aktualizacje profili i rekordów.
- `src/i18n.ts` — komplet tekstów PL/EN.
- `src/components/` — plansza, równania i modalne okna dialogowe.
- `src/sound.ts`, `src/pwa.ts`, `scripts/build-sw.mjs` — dźwięki i offline.
- [Wymagania](docs/REQUIREMENTS.md), [plan i stan etapów](docs/PLAN.md),
  [stan implementacji](docs/IMPLEMENTATION.md), [instrukcje](AGENTS.md),
  [historia zmian](CHANGELOG.md).
