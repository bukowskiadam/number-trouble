# Tracking Number Trouble

Stan: 16 października 2026. Interfejs pozostaje niezależny od dostawcy.
Produkcja na `bukowskiadam.github.io` korzysta z adaptera Umami Cloud i trwałej
kolejki IndexedDB. Lokalny development i inne hosty używają `console.log('[tracking]', event)`.
Nie dodano SDK ani zewnętrznego skryptu do strony.

## Plan pomiaru i zakres

| Pytanie                                                    | Zdarzenia i dane                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Czy gracze przechodzą od uruchomienia i instrukcji do gry? | `app_opened`: język, dostępność sieci, tryb browser/standalone; `screen_viewed`: play/profiles/records/game/summary; `help_opened`: menu/before_game; `game_started`: start/replay, poziom, tempo.               |
| Które ustawienia i funkcje są używane?                     | `setting_changed`: pole oraz poprzednia i nowa wartość poziomu, tempa, języka lub wyciszenia; `profile_changed`: created/selected/renamed/reset/deleted; `release_history_opened`: manual/update.                |
| Czy poziom lub tempo sprawia trudność?                     | `equation_resolved`: correct/wrong/missed, numer klocka, operator, prawdziwość równania, czas na odpowiedź, wynik i aktualna seria. Poziom i tempo są dołączone do każdego zdarzenia partii.                     |
| Jak kończą się partie i czy gracz wraca do gry?            | `game_paused`: manual/hidden; `game_resumed`; `game_ended`: board_full/exit, wynik, liczby poprawnych i błędnych ocen oraz pominięć, najlepsza seria, czas aktywnego spadania; `game_started` ze źródłem replay. |
| Czy gracze poprawiają wyniki?                              | `record_improved`: poziom, tempo, nowy i poprzedni rekord (`null` przy pierwszym). Remisy i słabsze wyniki nie generują zdarzenia.                                                                               |
| Czy można zapisywać dane i korzystać z PWA?                | `storage_status_changed`: available; `offline_status_changed`: preparing/ready/unavailable; `offline_retry_requested`; `update_requested`.                                                                       |
| Czy gracze korzystają z instalacji?                        | `install_requested`: prompt/instructions; `install_prompt_result`: accepted/dismissed/failed; `app_installed`: potwierdzenie zdarzeniem przeglądarki. Akceptacja promptu sama nie oznacza instalacji.            |

Z tych zdarzeń można później policzyć udział rozpoczętych i ukończonych partii,
powtórek, poprawnych ocen, błędów i pominięć w podziale na poziom oraz tempo,
a także rozkład czasu odpowiedzi i częstotliwość pauz. Nie ma zdarzeń każdej
klatki animacji ani każdego surowego kliknięcia.

## Kontrakt i podłączenie adaptera

`src/tracking.ts` eksportuje mapę `TrackingEvents`, unię `TrackingEvent`, interfejs
`TrackingAdapter`, fabrykę `createTracker` i wspólny obiekt `tracking`.
Nazwy i właściwości są sprawdzane przez TypeScript. Kod aplikacji używa:

```ts
tracking.track('setting_changed', {
  setting: 'language',
  previous: 'pl',
  value: 'en',
});
```

Adapter otrzymuje jeden obiekt:

```json
{
  "name": "setting_changed",
  "properties": { "setting": "language", "previous": "pl", "value": "en" },
  "schemaVersion": 1,
  "appVersion": "1.0.1",
  "timestamp": "2026-10-16T10:00:00.000Z"
}
```

`timestamp` to czas emisji UTC, a `schemaVersion` wersjonuje kontrakt niezależnie
od wersji aplikacji. Fabryka kopiuje i zamraża zdarzenie oraz płaskie właściwości.
Błędy synchroniczne i odrzucone Promise adaptera nie przerywają gry.
Wywołanie nie czeka na wysyłkę; adapter szybko oddaje sterowanie.

Adapter implementuje `TrackingAdapter.track(event)` zwracające `void` albo
`Promise<void>`. Wybór adaptera jest na końcu `src/tracking.ts`; wywołania
w aplikacji nie zależą od Umami. Implementacja transportu i mapowania jest
w `src/analytics/umami.ts`, a kolejki w `src/analytics/queue.ts`.

## Umami Cloud i wspólny projekt GitHub Pages

Domyślny publiczny Website ID to `a8bb101f-a5d7-4013-8c92-6a64b63e3cf2`, zapisany
w `src/analytics/config.ts`. To ID z podanego kodu śledzącego, nie klucz API.
Po publikacji zwykłego produkcyjnego buildu na `bukowskiadam.github.io` adapter
włącza się automatycznie. Nie trzeba dodawać sekretów ani drugiego projektu.

Transport używa oficjalnego `POST https://gateway.umami.is/api/send` bez tokena
uwierzytelniającego. Nie należy równolegle wklejać skryptu `cloud.umami.is/script.js`,
bo jego automatyczne odsłony dublowałyby pomiary adaptera.

Każdy payload, także odsłona, zawiera natywne `tag: number-trouble`:

1. Otwórz wspólną stronę w Umami i jej widok **Overview**.
2. W filtrach wybierz **Tag**, równość i wartość **number-trouble**.
3. W **Events → Properties** możesz dodatkowo sprawdzić `app = number-trouble`.

To natywny tag Umami, więc działa również dla odsłon, a nie tylko właściwości
zdarzeń. Pozostałe aplikacje mogą używać tego samego Website ID z innymi tagami,
np. `czytanki`. Ta zmiana dotyczy wyłącznie Number Trouble.

`screen_viewed` jest mapowane na jedną natywną odsłonę, bez dodatkowego custom eventu:
`/number-trouble/`, `/number-trouble/profiles`, `/number-trouble/records`,
`/number-trouble/game`, `/number-trouble/summary`. Są to ścieżki analityczne;
aplikacja nadal używa dotychczasowej nawigacji. Inne zdarzenia zachowują nazwy,
mają ścieżkę `/number-trouble/` oraz właściwości `app`, `appVersion`, `schemaVersion`
i `occurredAt`. Oryginalny czas trafia też do `payload.timestamp` w sekundach Unix.
Nie wysyłamy query string, fragmentu URL ani referrera.

Opcjonalna konfiguracja przy budowaniu (wzór w `.env.example`):

- `VITE_UMAMI_WEBSITE_ID` nadpisuje domyślne ID. Pusta wartość wyłącza adapter Umami.
- `VITE_UMAMI_HOSTNAME` nadpisuje dozwolony host; domyślnie `bukowskiadam.github.io`.
- Development zawsze pozostaje konsolowy, niezależnie od tych zmiennych.

Wszystkie wybrane zdarzenia, w tym każda rozstrzygnięta odpowiedź, są wysyłane;
nie ma próbkowania. Zdarzenia i odsłony wykorzystują limit wspólnego planu Umami.
Kolejka offline nie omija limitu usługi.

## Kolejka offline i ponawianie

- Zdarzenie trafia najpierw do IndexedDB, potem jest wysyłane. Usuwamy je dopiero
  po odpowiedzi HTTP 2xx. Błąd sieci, HTTP 429 lub inny błąd pozostawia wpis w kolejce.
- Wysyłka rusza po uruchomieniu aplikacji, dodaniu zdarzenia, powrocie sieci
  i powrocie do karty. Dodatkowy cykl co 30 sekund obsługuje ponawianie i wpisy
  z innych kart. Po nieudanej próbie obowiązuje 30 sekund przerwy; pojedyncze
  żądanie jest przerywane po 10 sekundach.
- Kolejka przetrwa przeładowanie i zamknięcie aplikacji. Przy zamkniętej aplikacji
  nie wykonujemy wysyłki w tle: zaległe wpisy zostaną podjęte po jej otwarciu.
- Limit to 1000 wpisów i 7 dni. Starsze i nadmiarowe wpisy są usuwane od najstarszych.
  Wyczyszczenie danych przeglądarki usuwa także kolejkę.
- Baza `number-trouble-umami-<Website ID>` oddziela dane od innych aplikacji
  i od innych docelowych stron Umami. Zmiana ID nie przekierowuje starej kolejki.
- Web Locks zapewnia jednego nadawcę w kilku kartach. Bez Web Locks możliwe są
  duplikaty przy równoległych kartach. Również utrata odpowiedzi po przyjęciu
  zdarzenia przez serwer może spowodować ponowienie: API nie gwarantuje deduplikacji.
- Jeśli IndexedDB jest niedostępne, bieżące zdarzenia używają ograniczonej kolejki
  w pamięci; nie przetrwają zamknięcia strony. Gra pozostaje używalna.
- Zdarzenia historyczne zachowują czas, ale informacje sieciowe po stronie Umami
  dotyczą wysyłki. Nie gwarantujemy odtworzenia dokładnych sesji wizyt offline.

Źródła kontraktu: [wysyłanie statystyk](https://docs.umami.is/docs/api/sending-stats),
[tagi i filtr Overview](https://docs.umami.is/docs/tags),
[czas zdarzenia](https://docs.umami.is/docs/tracker-functions),
[właściwości zdarzeń](https://docs.umami.is/docs/track-events).

## Znaczenie zdarzeń i granice pomiaru

- Otwarcie aplikacji oznacza jeden montaż aplikacji, także w React StrictMode.
  Przeładowanie generuje kolejne otwarcie. Widok jest emitowany przy wejściu
  i rzeczywistej zmianie ekranu, nie przy renderowaniu klatek czy zmianie języka.
- Zmiany ustawień i nazw bez zmiany wartości nie są emitowane. Utworzenie profilu
  zawiera domyślny wybór nowego dziecka; nie emituje dodatkowego `selected`.
  Reset i usunięcie wymagają zatwierdzenia w istniejącym oknie aplikacji.
- Każda partia otrzymuje nowy, losowy `gameId`, używany w jej zdarzeniach.
  `blockId` to kolejny numer równania w tej partii. Poziom i tempo pochodzą ze startu.
- Silnik tworzy rozstrzygnięcie dopiero po przyjęciu odpowiedzi albo pominięciu.
  Podwójne kliknięcia, stary klocek i odpowiedzi podczas pauzy nie tworzą zdarzeń.
  Kliknięcie na granicy lądowania jest pominięciem. Nawet jedna długa klatka
  zachowuje osobne wyniki, numery i czasy wszystkich pominiętych klocków.
- `responseMs` mierzy aktywne spadanie danego równania do rozstrzygnięcia;
  dla `missed` jest czasem do lądowania. Nie zawiera pauzy ani korekt.
  `activeFallingMs` sumuje aktywne spadanie całej partii, w tym nierozstrzygniętego
  klocka przy wyjściu. Nie jest czasem od startu do końca według zegara ściennego.
  Oba czasy są zaokrąglone do milisekund.
- `game_ended` pojawia się raz: po ostatniej korekcie przy pełnej planszy albo
  po potwierdzeniu wyjścia z pauzy. Anulowanie wyjścia nie kończy partii.
  Zamknięcie karty, przeładowanie lub awaria nie gwarantują zdarzenia końcowego;
  brak końca nie może być interpretowany jako ukończenie gry.
- `record_improved` oznacza przyjęcie lepszego wyniku do stanu aplikacji.
  Trwałość zapisu należy oceniać wraz ze `storage_status_changed`.
- Statusy pamięci i offline są emitowane początkowo i po zmianie wartości.
  `navigator.onLine` przy otwarciu jest wskazówką przeglądarki, nie testem
  dostępności internetu. Status offline dotyczy przygotowania pamięci PWA.

## Zakres danych

Nie przekazujemy nazw, inicjałów ani trwałych identyfikatorów profili, zawartości
formularzy, zawartości localStorage, treści błędów ani pełnych działań.
Nie tworzymy identyfikatora użytkownika lub urządzenia. Losowy `gameId` trafia
wyłącznie do zdarzeń danej partii (w tym kolejki) i nie łączy różnych partii
z konkretnym dzieckiem. Umami otrzymuje hostname, język i stałe ścieżki ekranów;
serwer może wyznaczać standardowe statystyki wizyt z żądania HTTP.
Z tego powodu ten kontrakt nie służy do analizy postępów konkretnego profilu
ani powrotów tego samego użytkownika po kilku dniach.

## Weryfikacja

Testy adaptera i silnika są w `src/tracking.test.ts` i `src/game/tracking.test.ts`.
Integrację konsoli, przebiegu partii, ustawień, profili, pauz, powtórek, offline
oraz awarii adaptera sprawdza `tests/tracking.spec.ts`. Wyniki w [QA.md](QA.md).

Testy Umami: `npm run test:umami`. Polecenie buduje aplikację z osobnym testowym ID,
przechwytuje wszystkie żądania do API w Playwright, sprawdza prawdziwy IndexedDB
oraz offline i na końcu przywraca zwykły build produkcyjny. Testy nie zapisują
ruchu na prawdziwym koncie Umami. Workflow GitHub Pages wykonuje ten krok przed
publikacją. Zwykłe `npm run test:e2e` pomija scenariusze wymagające tego buildu.
