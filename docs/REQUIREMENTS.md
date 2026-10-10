# Number Trouble — wymagania

Data: 10 października 2026. Status: MVP zaimplementowane; wyniki weryfikacji i próby sprzętowe w [QA.md](QA.md).

Number Trouble ma pomagać dzieciom ćwiczyć matematykę w grze ze spadającymi
elementami. MVP obejmuje cztery gotowe poziomy dodawania i odejmowania; mnożenie,
dzielenie i własna konfiguracja są odłożone na później. Dziecko ocenia gotowe równanie, a poprawna ocena
usuwa element i daje punkty. Błędy i brak odpowiedzi stopniowo zapełniają planszę.

Sekcja „Ustalone założenia” zapisuje ustalenia z rozmowy. Dalsze sekcje rozwijają je
w wymagania i kryteria akceptacji. Szczegóły oznaczone jako propozycje oraz parametry
tempa zostaną dopracowane podczas implementacji i prób gry; nie blokują rozpoczęcia prac.

## Ustalone założenia

- Nazwa gry: **Number Trouble**.
- Osobny projekt w katalogu `number-trouble`, obok `czytanki`.
- MVP ćwiczy dodawanie i odejmowanie na czterech gotowych poziomach opisanych poniżej.
- Dzieci mają różne umiejętności; punktem wyjścia jest dodawanie i odejmowanie małych liczb.
- MVP używa wyłącznie liczb całkowitych nieujemnych, również w wynikach.
- Wszystkie cztery poziomy są dostępne od początku, bez odblokowywania.
- Tempo wybiera się niezależnie od poziomu: wolno (żółw), normalnie (koń), szybko (gepard).
- Mnożenie, dzielenie, trudniejsze warianty i własny wybór działań oraz zakresów są odłożone na później.
- Z góry planszy spadają działania z gotowym wynikiem, np. `2 + 1 = 3` lub `7 − 5 = 4`.
- Część równań jest prawdziwa, a część zawiera celowo błędny wynik.
- Pod każdym spadającym działaniem znajdują się dwa przyciski: „dobrze” i „źle”.
- Przyciski poruszają się razem z działaniem.
- Plansza ma jedną szeroką kolumnę; każde działanie zajmuje całą jej szerokość.
- Kolumna mieści 8 klocków. Łącznie osiem błędów lub braków odpowiedzi zapełnia planszę i kończy grę.
- Zawsze spada tylko jedno działanie. Kolejne pojawia się po odpowiedzi lub wylądowaniu poprzedniego.
- Poprawna odpowiedź dziecka usuwa działanie z planszy i dodaje punkty.
- Pierwsza poprawna odpowiedź w serii daje 10 punktów, druga 11, trzecia 12 itd.
  Osobny licznik streak pokazuje długość aktualnej serii poprawnych odpowiedzi.
- Błąd i brak odpowiedzi nie odejmują zdobytych punktów.
- Niepoprawna odpowiedź powoduje opadnięcie elementu na dół i zajęcie miejsca na planszy.
- Przed opadnięciem po błędzie przez około 2 sekundy widać korektę równania:
  niepoprawny wynik jest przekreślony, a poprawny wyróżniony. Korekta pozostaje widoczna podczas opadania.
- Brak odpowiedzi przed dotarciem do stosu lub dna również zajmuje miejsce na planszy.
- Po braku odpowiedzi również pokazujemy korektę przez około 2 sekundy, po wylądowaniu klocka.
- Rosnący stos skraca drogę spadania kolejnych działań, a przez to czas na odpowiedź.
- W trakcie rozgrywki działania spadają coraz szybciej.
- Zapełnienie jedynej kolumny do górnej granicy kończy grę.
- Trudność matematyczna ma być dostosowana do umiejętności dziecka i oczekiwań rodzica.
- MVP ma interfejs polski i angielski, z przełącznikiem języka i przewagą symboli.
- MVP zawiera osobne profile dzieci i ich rekordy dla każdej kombinacji poziomu i tempa.
- Profile działają jak w Czytankach: zapis lokalny, wybór dziecka, dodawanie,
  zmiana nazwy, usuwanie i reset danych wybranego profilu.
- Wygląd jest zbliżony do Czytanek, z paletą niebieską i błękitną.
- Gra ma krótkie dźwięki odpowiedzi i zakończenia gry oraz możliwość wyciszenia.
- MVP jest instalowalną aplikacją PWA i działa offline po pierwszym pełnym załadowaniu oraz zapisaniu zasobów.

## Znaczenie odpowiedzi

Przyciski oceniają **prawdziwość równania**, a nie to, czy dziecko chce zachować klocek.
„Błędny wynik w równaniu” i „błędna odpowiedź dziecka” to dwa różne pojęcia.

| Równanie    | Wybór dziecka           | Ocena odpowiedzi | Skutek                            |
| ----------- | ----------------------- | ---------------- | --------------------------------- |
| `2 + 1 = 3` | Dobrze / ✓              | Poprawna         | Element znika, przybywa punktów.  |
| `2 + 1 = 3` | Źle / ✗                 | Niepoprawna      | Element opada i zajmuje miejsce.  |
| `7 − 5 = 4` | Dobrze / ✓              | Niepoprawna      | Element opada i zajmuje miejsce.  |
| `7 − 5 = 4` | Źle / ✗                 | Poprawna         | Element znika, przybywa punktów.  |
| Dowolne     | Brak odpowiedzi na czas | Brak odpowiedzi  | Element osiada i zajmuje miejsce. |

## MVP — ustalenia i propozycje szczegółów

### Przebieg gry i plansza

1. Rodzic lub dziecko wybiera profil, jeden z czterech dostępnych poziomów i tempo: żółw, koń lub gepard.
2. Krótka instrukcja pokazuje na przykładach znaczenie ✓ i ✗.
3. Rozgrywka rozpoczyna się z pustą planszą, zerowym wynikiem i licznikiem streak równym zero.
4. Działania pojawiają się nad planszą i spadają do momentu odpowiedzi lub lądowania.
5. Gra kończy się po zapełnieniu kolumny ósmym klockiem powstałym z błędu lub braku odpowiedzi.
6. Po zakończeniu ostatniej korekty podsumowanie pokazuje punkty, poprawne odpowiedzi,
   błędy, brak odpowiedzi oraz rekord wybranego dziecka dla danego poziomu i tempa.
   Pozwala zagrać ponownie.

Ustalony układ to jedna szeroka kolumna i stos poziomych warstw. Każde działanie
zajmuje całą szerokość planszy. Zawsze spada tylko jeden element; kolejne działanie
pojawia się po rozstrzygnięciu poprzedniego. Po błędnej odpowiedzi najpierw kończy
się opadanie elementu na stos. Zapełnienie jedynej kolumny kończy rozgrywkę.

Plansza mieści 8 warstw o jednakowej wysokości. Każdy błąd lub brak odpowiedzi dodaje
jeden klocek. Pojemność jest taka sama dla wszystkich poziomów, temp i rozmiarów
ekranu. Po siódmym klocku gra trwa dalej; ósmy kończy partię. Końcowe podsumowanie
nie może zasłonić wymaganego pokazu korekty ostatniego działania.

Po błędnej odpowiedzi element traci możliwość kliknięcia i zatrzymuje się na około
2 sekundy, pokazując korektę opisaną w sekcji „Punkty i informacja zwrotna”.
Następnie opada na stos z nadal widoczną korektą. Kolejny element pojawia się dopiero
po zakończeniu tego opadania, o ile kolumna nie jest pełna.
Poprawna odpowiedź usuwa wyłącznie aktywny element; nie obniża istniejącego stosu.
W tym wariancie nie ma obracania klocków, ręcznego przesuwania ani kasowania pełnych rzędów.
Wiele kolumn i kilka jednocześnie spadających działań nie należą do wybranego wariantu gry.

### Generowanie działań

- Dostępne są dodawanie i odejmowanie zgodnie z wybranym gotowym poziomem.
- Argumenty i wyniki są liczbami całkowitymi nieujemnymi; zero jest dozwolone.
- Odejmowanie nie daje ujemnego prawdziwego wyniku.
- MVP nie zawiera mnożenia, dzielenia ani edytora własnych zakresów i działań.
- Każde równanie zawiera jedno działanie i ma postać `a operator b = c`.
- Generator oblicza prawdziwy wynik niezależnie od wyniku wyświetlanego dziecku.
- Celowo błędny wynik zawsze różni się od prawdziwego i jest nieujemną liczbą całkowitą.
- Proponowany zakres fałszywego wyniku odpowiada zakresowi prawdziwych wyników danej operacji
  na wybranym poziomie, tak aby sam zakres nie zdradzał odpowiedzi.
- Prawdziwe i fałszywe równania mają zbliżony udział, bez przewidywalnego przeplatania.
- Wygląd, pozycja i prędkość elementu nie zdradzają prawdziwości równania.
- Należy ograniczyć bezpośrednie powtórzenia tego samego równania, gdy zakres na to pozwala.

### Ustalone cztery poziomy MVP

W każdym równaniu występują dokładnie dwie liczby i jeden operator.
Ograniczenia sumy i wyniku w tabeli dotyczą prawdziwego wyniku działania,
nie celowo błędnej wartości wyświetlonej dziecku.

| Poziom                                  | Działania               | Argumenty i prawdziwy wynik                                                                       | Przykłady prawdziwych równań           |
| --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1 — Suma do 10                          | Dodawanie               | `a ≥ 0`, `b ≥ 0`, `a + b ≤ 10`.                                                                   | `2 + 1 = 3`, `6 + 4 = 10`              |
| 2 — Dodawanie liczb do 10               | Dodawanie               | Każdy składnik od 0 do 10 włącznie; suma od 0 do 20.                                              | `8 + 7 = 15`, `10 + 10 = 20`           |
| 3 — Dodawanie i odejmowanie liczb do 10 | Dodawanie i odejmowanie | Oba argumenty od 0 do 10 włącznie; przy odejmowaniu `a ≥ b`. Suma od 0 do 20, różnica od 0 do 10. | `9 + 6 = 15`, `7 − 5 = 2`, `4 − 4 = 0` |
| 4 — Suma do 100                         | Dodawanie               | `a ≥ 0`, `b ≥ 0`, `a + b ≤ 100`; dopuszczalne składniki większe niż 10.                           | `37 + 48 = 85`, `60 + 40 = 100`        |

Limity są włączne. Poziom 2 dopuszcza sumę większą niż 10, a poziom 3 również
dopuszcza taką sumę przy dodawaniu. Na poziomie 4 nie obowiązuje ograniczenie
pojedynczego składnika do 10. Rodzic lub dziecko wybiera gotowy poziom; w MVP
nie konfiguruje osobno operatorów ani zakresów argumentów i wyników.

Ustalono: wszystkie cztery poziomy są dostępne od początku, bez odblokowywania.
Dobór wiarygodnych błędnych wyników i proporcji operatorów na poziomie 3 pozostaje
szczegółem do dopracowania w prototypie.

### Trudność i tempo

Trudność matematyczną wybiera się przez jeden z czterech ustalonych poziomów.
Tempo jest osobnym wyborem dostępnym na każdym poziomie:

| Tempo     | Symbol |
| --------- | ------ |
| Wolno     | Żółw   |
| Normalnie | Koń    |
| Szybko    | Gepard |

Symbole zwierząt są głównym oznaczeniem tempa. Towarzyszą im tłumaczone nazwy
i etykiety dostępności, aby wybór był jednoznaczny. Zmiana poziomu matematyki
nie zmienia automatycznie wybranego tempa.

- Trudność matematyczna: gotowe działania i zakresy przypisane do wybranego poziomu.
- Tempo: początkowa prędkość spadania oraz tempo jej wzrostu.
- Tolerancja błędów: 8 klocków łącznie z błędów i braków odpowiedzi.
- Prędkość wzrasta wraz z czasem aktywnej rozgrywki; pauza nie jest wliczana.
- Propozycja: dwusekundowy pokaz korekty również nie zwiększa prędkości; służy przeczytaniu wyniku.
- Im wyższy stos, tym krótszy czas na odpowiedź przy tej samej prędkości.
- Parametry ruchu powinny zapewniać porównywalny czas na odpowiedź na telefonie i komputerze,
  niezależnie od wysokości ekranu i liczby klatek animacji.

Dokładne prędkości, interwał przyspieszania i ewentualny limit prędkości zostaną
dobrane w prototypie. Pojemność planszy jest już ustalona na 8 klocków.

### Punkty i informacja zwrotna

- Ustalona punktacja: dla `n`-tej kolejnej poprawnej odpowiedzi w serii przyznajemy
  `10 + (n − 1)` punktów. Pierwsza daje 10, druga 11, trzecia 12 itd., bez limitu premii.
- Osobny, widoczny na planszy licznik streak pokazuje liczbę kolejnych poprawnych
  odpowiedzi, a główny wynik pokazuje sumę zdobytych punktów.
- Przyjęte doprecyzowanie serii: błąd lub brak odpowiedzi zeruje streak, ale nie
  odejmuje punktów. Następna poprawna odpowiedź daje ponownie 10 punktów.
- Błąd i brak odpowiedzi dają 0 punktów; zajmują miejsce na planszy.
- Pauza i korekta nie są odpowiedziami i same nie zmieniają punktów ani streaku.
  Nowa gra zaczyna nową serię. Nie ma dodatkowej premii za szybkość odpowiedzi.
- Ta sama odpowiedź może zostać rozliczona tylko raz, również przy szybkim podwójnym kliknięciu.
- Po lądowaniu lub udzieleniu odpowiedzi przyciski danego elementu przestają działać.
- Kliknięcie w chwili lądowania musi mieć jednoznaczny skutek: jeśli element już osiągnął stos,
  liczy się brak odpowiedzi, a późniejszy wybór nie zmienia wyniku.
- Krótki efekt wizualny pokazuje, czy ocena była poprawna; sam kolor nie wystarcza.
- Ustalono: po błędnej odpowiedzi równanie zatrzymuje się na około 2 sekundy.
  Błędny wynik zostaje przekreślony, a prawdziwy wynik pokazany obok i wyróżniony,
  np. `7 − 5 =` **~~4~~ 2**. Wyróżnienie nie może opierać się wyłącznie na kolorze.
- Klocek następnie opada z widoczną korektą i zachowuje ją na stosie.
- Szczegół wynikający z zasad: jeśli dziecko odrzuciło prawdziwe równanie, np. wybrało ✗
  przy `2 + 1 = 3`, wyróżniamy prawdziwy wynik `3` bez przekreślania go i wskazujemy,
  że równanie było prawdziwe. Nie wolno oznaczać poprawnej liczby jako błędnej.
- Ustalono: po braku odpowiedzi i wylądowaniu klocka również pokazujemy przez około
  2 sekundy prawdziwe równanie, z przekreśleniem tylko faktycznie błędnego wyniku.
  Dopiero potem przechodzimy do kolejnego działania lub podsumowania. Korekta
  pozostaje na klocku w stosie; gdy równanie było prawdziwe, wyróżniamy jego wynik.
- Podsumowanie oddziela błędne odpowiedzi od braku odpowiedzi, żeby było wiadomo,
  czy problem dotyczył oceny działania, czy zdążenia na czas.

Przykład rozliczenia:

| Zdarzenie                              | Streak po zdarzeniu | Przyznane punkty | Łączny wynik |
| -------------------------------------- | ------------------- | ---------------- | ------------ |
| Pierwsza poprawna odpowiedź            | 1                   | 10               | 10           |
| Druga poprawna odpowiedź               | 2                   | 11               | 21           |
| Trzecia poprawna odpowiedź             | 3                   | 12               | 33           |
| Błąd lub brak odpowiedzi               | 0                   | 0                | 33           |
| Poprawna odpowiedź po przerwaniu serii | 1                   | 10               | 43           |

### Sterowanie i języki

- Główne sterowanie: dwa przyciski bezpośrednio pod działaniem, poruszające się razem z nim.
- Symbole ✓ i ✗ mają stałą kolejność i duże pola dotykowe, proponowane minimum 48 × 48 px.
- Podczas wprowadzenia symbole są podpisane „Dobrze” i „Źle” lub odpowiednikami w wybranym języku.
- Etykiety dostępności przycisków jasno mówią „Równanie jest prawdziwe” i „Równanie jest fałszywe”.
- Gra działa myszą i dotykiem; prototyp powinien również przewidzieć sterowanie klawiaturą.
- Ruch przycisków nie może powodować utraty kliknięć podczas zwykłego dotknięcia ekranu.
- Ustalone języki MVP: polski i angielski, z przełącznikiem języka.
- Tłumaczenia obejmują menu, instrukcje, ustawienia, profile, rekordy, podsumowanie i etykiety dostępności.
- Teksty są oddzielone od logiki gry, aby można było dodać kolejne języki.
- Działania w MVP używają czytelnych symboli `+`, `−`, `=`.
- Nazwa Number Trouble pozostaje wspólna dla wersji językowych.

Stałe przyciski pod planszą były sugestią z rozmowy, ale nie zostały wybrane.
Można je rozważyć jako opcję po sprawdzeniu głównego wariantu z ruchomymi przyciskami.

### Profile dzieci i rekordy

Ustalono: każde dziecko ma osobny profil i własne rekordy na poszczególnych
poziomach i tempach. Cztery poziomy i trzy tempa tworzą 12 niezależnych kombinacji
dla każdego profilu. Wynik jednego dziecka nie zmienia rekordów innych dzieci.

Obsługa profili ma odpowiadać Czytankom, zgodnie z istniejącą
[dokumentacją profili](../../czytanki/docs/PROFILES.md) i implementacją
[menedżera profili](../../czytanki/src/components/ProfileManager.tsx):

- Profil ma nazwę lub pseudonim oraz oznaczenie inicjałem jak w Czytankach.
  Wybór dowolnych awatarów nie jest częścią tego wzorca.
- Pierwsze uruchomienie tworzy jeden pusty profil z domyślnymi ustawieniami.
- Można dodawać dzieci, wybierać profil i zmieniać nazwę. Nowy profil wymaga niepustej
  nazwy po usunięciu skrajnych spacji; limit wynosi 30 znaków. Nazwy mogą się powtarzać.
- Nowy profil jest automatycznie wybierany i nie ma rekordów. Aplikacja pamięta
  ostatnio wybrane dziecko po ponownym uruchomieniu.
- Każdy profil ma trwały identyfikator niezależny od nazwy.
- Przełączenie profilu odbywa się poza rozgrywką i wraca do ekranu startowego.
- Usunięcie profilu wymaga potwierdzenia z nazwą dziecka. Usunięcie aktywnego profilu
  wybiera pierwszy pozostały. Ostatniego profilu nie można usunąć.
- Reset danych wymaga potwierdzenia i czyści tylko rekordy wybranego dziecka,
  zachowując nazwę i ustawienia.
- Rekordy i ustawienia gry są osobne dla każdego dziecka.
- Profile i dane są przechowywane lokalnie w przeglądarce, bez kont i synchronizacji
  między urządzeniami. Usunięcie danych przeglądarki usuwa profile i rekordy.
- Dane Number Trouble mają własny klucz zapisu, niezależny od Czytanek.
  Wspólny sposób obsługi nie oznacza wspólnych profili ani importowania danych z Czytanek.
- Odczyt weryfikuje zapisane dane. Niepoprawne wartości są naprawiane, powtórzone
  identyfikatory pomijane, a nieznany aktywny profil zastępowany pierwszym prawidłowym.
  Brak prawidłowych profili tworzy jeden pusty profil.
- Przy błędzie zapisu aplikacja pokazuje komunikat i pozostaje używalna w pamięci.

Przyjęte szczegóły rekordów dla tej gry:

- Przed rozpoczęciem gry widać aktywny profil, poziom, tempo i dotychczasowy rekord tej kombinacji.
- Rekord jest najwyższym wynikiem punktowym z zakończonej rozgrywki w danej kombinacji.
- Pierwsza ukończona partia ustanawia rekord; niższy wynik ani remis nie zastępują rekordu.
- Kombinacja, w której dziecko jeszcze nie grało, pokazuje brak rekordu zamiast zera.
- Profil, poziom i tempo są przypisane do partii w chwili startu. Nie można przełączyć
  dziecka podczas rozgrywki i przypisać jego wyniku innemu profilowi.
- Zmiana nazwy profilu zachowuje rekordy. Usunięcie profilu usuwa wyłącznie jego dane.
- Po ponownym otwarciu aplikacji profile i rekordy są dostępne, o ile dane przeglądarki nie zostały usunięte.

Pełna historia wszystkich partii nie jest konieczna do przechowywania rekordów.

### Oprawa graficzna i dźwięki

- Ustalony kierunek: wygląd zbliżony do Czytanek, ale w kolorach niebieskich i błękitnych.
- Zachować czytelną typografię, łagodne kształty kart, duże przyciski i spokojną,
  przyjazną dzieciom stylistykę. Konkretne kolory i ilustracje dobrać podczas projektowania.
- Żółw, koń i gepard oznaczają trzy tempa i są spójne stylistycznie z resztą interfejsu.
- Dodać krótkie dźwięki poprawnej odpowiedzi, błędu lub braku odpowiedzi i zakończenia gry.
- Udostępnić widoczny przycisk wyciszenia; przyjęty szczegół: zapamiętać tę preferencję
  w ustawieniach dziecka. Wyciszenie obejmuje wszystkie efekty gry.
- Dźwięki uzupełniają informację wizualną. Gra jest w pełni zrozumiała bez dźwięku.
- Niedostępny lub zablokowany dźwięk nie blokuje gry. Muzyka w tle nie jest wymagana w MVP.

### Pauza, urządzenia i zapis

- Platforma: responsywna aplikacja przeglądarkowa PWA na telefon, tablet i komputer.
- Pauza zatrzymuje ruch, generowanie elementów i wzrost prędkości.
- Ukrycie karty przeglądarki automatycznie włącza pauzę; powrót wymaga wznowienia.
- Zmiana rozmiaru lub orientacji ekranu nie usuwa stosu i nie rozstrzyga automatycznie aktywnego działania.
- Nowa gra zeruje planszę, punkty, streak, czas i tempo do wartości początkowych wybranej konfiguracji.
- Zapis lokalny obejmuje profile, ich rekordy, język i ostatnie ustawienia gry.
- Brak możliwości zapisu nie blokuje rozgrywki; aplikacja informuje, że nowe lub zmienione
  profile, rekordy i ustawienia nie zostaną zachowane po zamknięciu aplikacji.
- Pierwsza wersja nie wymaga konta ani serwera aplikacyjnego.
- Dodatkowe animacje powinny respektować preferencję ograniczonego ruchu; sam ruch spadania jest częścią zasad.

### Instalacja i działanie offline

- MVP można zainstalować na ekranie głównym telefonu lub tabletu, zgodnie z możliwościami przeglądarki.
- Pierwsze pełne pobranie aplikacji i jej zasobów wymaga internetu. Po przygotowaniu
  pamięci offline można zamknąć aplikację i ponownie uruchomić ją bez sieci.
- Offline działają wszystkie cztery poziomy, trzy tempa, oba języki, instrukcje,
  korekty odpowiedzi, dźwięki, ustawienia, profile i odczyt oraz zapis rekordów.
- Dostępność offline obejmuje także poziomy i języki, których wcześniej nie otwarto.
- Wszystkie potrzebne zasoby, w tym fonty, grafiki, ikony i pliki dźwiękowe, są częścią
  aplikacji i pamięci offline. Dopuszczalne są też dźwięki generowane lokalnie.
- Generator działań i logika rozgrywki nie wymagają połączenia z usługami zewnętrznymi.
- Aplikacja informuje o gotowości offline dopiero po poprawnym zapisaniu wymaganych zasobów.
  Nieudane przygotowanie pamięci offline nie blokuje gry przy dostępnym internecie.
- Aktualizacja aplikacji nie przerywa aktywnej rozgrywki ani nie usuwa profili i rekordów.
- Manifest, ikony, adres startowy i pamięć zasobów należą do Number Trouble,
  niezależnie od Czytanek. Publikacja ma obsługiwać również osobną ścieżkę projektu.
- Testy instalacji i offline wykonujemy na produkcyjnym buildzie w odpowiednim środowisku
  przeglądarki; lokalny zapis rekordów sam w sobie nie zapewnia uruchamiania offline.

## Poza MVP

Ustalono odłożenie następujących rozszerzeń:

- Mnożenie i dzielenie.
- Własna konfiguracja dozwolonych działań oraz zakresów argumentów i wyników.
- Ułamki, liczby ujemne i inne trudniejsze warianty działań.

Pozostałe proponowane wyłączenia z MVP:

- Pełna historia partii i wykresy postępów; profile i rekordy należą do MVP.
- Rankingi, konta, synchronizacja między urządzeniami i rozgrywka wieloosobowa.
- Adaptacyjne dobieranie trudności na podstawie wyników.
- Potęgi i kolejność wykonywania działań.
- Dodatkowe bonusy poza premią za streak, czyszczenie stosu, kampania fabularna i odznaki.
- Osobny tryb ćwiczeń bez limitu czasu.

## Szczegóły do dopracowania w prototypie

Zakres MVP jest ustalony. Pozostają szczegóły wykonania, które można dobrać podczas
prac bez rozszerzania funkcjonalności:

| Temat           | Zakres dopracowania                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Parametry tempa | Dobrać prędkości żółwia, konia i geparda, przyspieszanie i ewentualny limit prędkości. Pojemność pozostaje równa 8. |
| Generator       | Dobrać wiarygodne fałszywe wyniki i udział dodawania oraz odejmowania na poziomie 3.                                |
| Czytelność      | Dopasować wysokość i układ klocków, ruchome przyciski oraz widoczność korekty przy prawie pełnej planszy.           |
| Oprawa          | Dobrać konkretne odcienie błękitu, ilustracje i krótkie efekty dźwiękowe.                                           |

## Kryteria akceptacji MVP

- Wszystkie pięć przypadków z tabeli „Znaczenie odpowiedzi” daje opisany skutek.
- Plansza ma jedną kolumnę; działanie zajmuje jej całą szerokość i nigdy nie spadają dwa elementy jednocześnie.
- Dostępne są dokładnie cztery ustalone poziomy z tabeli; każdy pozwala rozegrać pełną partię.
- Wszystkie poziomy można wybrać od pierwszego uruchomienia, bez odblokowywania.
- Każdy poziom można połączyć z dowolnym z trzech temp oznaczonych żółwiem, koniem i gepardem.
- Na poziomie 1 suma nie przekracza 10; na poziomie 2 każdy składnik nie przekracza 10, ale suma może wynosić 20.
- Na poziomie 3 oba argumenty nie przekraczają 10, występują dodawanie i odejmowanie, a wynik nigdy nie jest ujemny.
- Na poziomie 4 suma nie przekracza 100, a generator dopuszcza składniki większe niż 10.
- Generator nie tworzy ułamków, ujemnych liczb ani fałszywego równania z prawdziwym wynikiem.
- MVP nie udostępnia mnożenia, dzielenia ani własnej konfiguracji działań i zakresów.
- Przyciski pozostają pod działaniem i poruszają się razem z nim; da się ich używać na ekranie dotykowym.
- Błąd i brak odpowiedzi zwiększają stos dokładnie raz; poprawna odpowiedź dodaje punkty dokładnie raz.
- Trzy poprawne odpowiedzi z rzędu dają łącznie 33 punkty i streak 3; błąd lub brak odpowiedzi zeruje streak, zachowując 33 punkty; następna poprawna daje wynik 43 i streak 1.
- Po błędnej odpowiedzi korekta jest czytelna przez około 2 sekundy przed opadaniem i pozostaje na opadającym klocku.
- Po braku odpowiedzi korekta jest czytelna przez około 2 sekundy po lądowaniu, również przed podsumowaniem ostatniego klocka.
- Korekta przekreśla wyłącznie faktycznie błędny wynik i wyróżnia prawdziwy; odrzucenie prawdziwego równania nie przekreśla poprawnej liczby.
- Rosnący stos skraca dostępny czas, a czas aktywnej gry zwiększa prędkość spadania.
- Siedem błędów lub braków odpowiedzi nie kończy gry; ósmy zapełnia kolumnę i kończy partię po pokazaniu korekty. Dziewiąty klocek nie powstaje.
- Pauza i ukrycie karty nie powodują utraty czasu ani narastania stosu.
- Ponowna gra zaczyna się od pustej planszy i początkowej prędkości.
- Menu i komunikaty są kompletne po polsku i angielsku; przełącznik zmienia język interfejsu.
- Można wybrać osobne profile dzieci, a każde dziecko ma niezależne rekordy w 12 kombinacjach poziomu i tempa.
- Rekord danego profilu i kombinacji nie zmienia wyniku innego profilu ani innej kombinacji.
- Profile i rekordy wracają po ponownym otwarciu aplikacji; zmiana nazwy zachowuje rekordy.
- Usunięcie lub reset dotyczy tylko wskazanego profilu i wymaga potwierdzenia; nie można usunąć ostatniego profilu.
- Błędy odczytu lub zapisu profili nie uniemożliwiają gry; dane Czytanek pozostają niezależne.
- Niebieska i błękitna oprawa zachowuje czytelność liczb, przycisków i korekt.
- Dźwięki odpowiedzi i końca gry działają, wyciszenie obejmuje wszystkie efekty, a bez dźwięku nadal widać cały przebieg gry.
- Po przygotowaniu offline aplikacja uruchamia się ponownie bez sieci i pozwala grać na każdym poziomie oraz w każdym tempie i języku, także wcześniej nieużywanym.
- Offline można tworzyć i wybierać profile, rozgrywać partie oraz zapisywać rekordy; dane pozostają po ponownym otwarciu.
- Manifest i ikony pozwalają zainstalować aplikację w obsługiwanej przeglądarce, a zainstalowana aplikacja uruchamia się offline.
- Aktualizacja nie przerywa partii i zachowuje rekordy oraz profile.
- Plansza i sterowanie mieszczą się na telefonie, tablecie i komputerze.
- Podsumowanie poprawnie rozdziela punkty, poprawne oceny, błędne oceny i brak odpowiedzi.

## Parametry wybrane w implementacji MVP

- Prędkość początkowa w logicznych warstwach na sekundę: żółw **0,55**, koń **0,85**,
  gepard **1,20**. Pusta plansza daje odpowiednio około 14,5 / 9,4 / 6,7 s bez
  przyspieszenia. Droga wynosi `8 − liczba zajętych miejsc`.
- Mnożnik prędkości: `1 + min(czas aktywnego spadania w sekundach, 180) / 90`.
  Maksymalna prędkość to trzykrotność początkowej. Pauza, korekta, opadanie po błędzie
  i krótka informacja o trafnej ocenie nie zwiększają tego czasu.
- Korekta: **2000 ms**, opadanie po niej: **400 ms**, informacja o trafnej ocenie:
  **280 ms**. Dopiero potem powstaje następne równanie.
- Generator losuje około 50% prawdziwych równań. Na poziomie 3 operatory mają
  prawdopodobieństwo około 50/50. Fałszywy wynik różni się od prawdziwego o 1–3
  (poziomy 1–3) lub 1–10 (poziom 4), pozostaje w zakresie danej operacji.
  Bezpośrednie powtórzenie całego równania jest wykluczone.
- Plansza używa normalizowanej drogi, niezależnej od pikseli i liczby klatek.
  Górny zapas 64 px oraz dolny 68 px zostawiają miejsce na przyciski; osiem warstw
  ma po 22–40 px zależnie od ekranu. Przyciski mają co najmniej 100 × 48 px.
- Odpowiedź dotykowa jest przyjmowana na `pointerdown`, żeby ruch przycisku pomiędzy
  dotknięciem i puszczeniem nie gubił trafień. Klawiatura zachowuje standardowe
  Enter/Space dla przycisków; poza nimi działają skróty opisane w interfejsie.
- Kolory: tło `#f5f8fb`, główny błękit `#2767ac`, tekst `#263d53`.
  Lokalne fonty Nunito i DM Sans nawiązują do Czytanek.

To wartości początkowe do ewentualnego dostrojenia po próbach z dziećmi. Nie zmieniają
ustalonej pojemności, zakresów ani punktacji.
