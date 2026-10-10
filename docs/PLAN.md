# Number Trouble — plan realizacji

Data: 10 października 2026. Status: zakres MVP ustalony, plan gotowy do implementacji.

Celem jest przygotowanie gry opisanej w [wymaganiach](REQUIREMENTS.md), zaczynając
od sprawdzenia mechaniki spadania i ruchomych przycisków. Zakres obejmuje osiem
klocków na planszy, cztery poziomy, trzy tempa, streak, profile i rekordy, dwa języki,
dźwięki oraz instalację i działanie offline. Parametry tempa dopracujemy w prototypie.

## Etap 0 — koncepcja i zakres

- [x] Wybrać nazwę Number Trouble.
- [x] Utworzyć osobny katalog projektu i dokumentację w `docs`.
- [x] Zapisać zasady, propozycje pierwszej wersji i otwarte decyzje.
- [x] Wybrać geometrię planszy i liczbę aktywnych działań: jedna szeroka kolumna, zawsze jedno spadające działanie.
- [x] Ustalić koniec gry: zapełnienie jedynej kolumny do górnej granicy.
- [x] Ustalić cztery poziomy MVP: suma do 10, dodawanie liczb do 10, dodawanie i odejmowanie liczb do 10, suma do 100.
- [x] Ograniczyć MVP do liczb całkowitych nieujemnych; mnożenie, dzielenie i własną konfigurację odłożyć na później.
- [x] Udostępnić wszystkie poziomy od początku i ustalić wybór tempa: żółw, koń, gepard.
- [x] Ustalić korektę po błędzie: około 2 sekundy pokazu, błędny wynik przekreślony, poprawny wyróżniony, potem opadanie z widoczną korektą.
- [x] Pokazywać korektę również po braku odpowiedzi, przez około 2 sekundy po lądowaniu klocka.
- [x] Ustalić polski i angielski interfejs z przełącznikiem języka i przewagą symboli.
- [x] Włączyć do MVP profile dzieci i ich osobne rekordy dla 12 kombinacji poziomu i tempa.
- [x] Przyjąć obsługę profili i zapis lokalny jak w Czytankach, z niezależnymi danymi Number Trouble.
- [x] Ustalić punktację serii: 10, 11, 12 punktów itd. oraz osobny licznik streak, bez odejmowania punktów.
- [x] Wybrać styl Czytanek w niebieskiej i błękitnej palecie, z krótkimi dźwiękami i wyciszeniem.
- [x] Ustalić pojemność planszy: 8 klocków, niezależnie od poziomu i tempa.
- [x] Włączyć instalację PWA i pełne działanie offline do MVP.
- [x] Ustalić zakres pierwszej wersji; szczegóły wykonania dobrać w prototypie.

Etap zakończony: zakres i główne zasady MVP są ustalone.

## Etap 1 — grywalny prototyp mechaniki

- Przygotować planszę z jedną szeroką kolumną, jednym spadającym równaniem naraz i dwoma ruchomymi przyciskami.
- Użyć kilku znanych równań prawdziwych i fałszywych, aby sprawdzić wszystkie skutki odpowiedzi.
- Dodać usuwanie elementu, punkty, opadanie po błędzie, lądowanie bez odpowiedzi i rosnący stos.
- Dodać osobny licznik streak, rosnące nagrody 10, 11, 12 punktów itd. oraz przerwanie serii po błędzie lub braku odpowiedzi.
- Dodać koniec gry po ósmym klocku, ponowny start, pauzę i stopniowe przyspieszanie.
- Dodać trzy tempa oznaczone żółwiem, koniem i gepardem, niezależne od poziomu matematyki.
- Sprawdzić czytelność i trafianie w przyciski na telefonie oraz tablecie.
- Dobrać początkowe tempa i przyspieszanie przy stałej pojemności 8 klocków; zapisać wartości w wymaganiach.

Etap kończy się grywalną pętlą od startu do zapełnienia planszy. Można ocenić,
czy ruchome przyciski są wygodne i czy dziecko ma czas przeczytać działanie.

## Etap 2 — generator i cztery poziomy MVP

- Wydzielić generator działań i ocenianie odpowiedzi z warstwy animacji.
- Dodać wybór czterech gotowych poziomów z dokładnymi ograniczeniami podanymi w wymaganiach.
- Obsłużyć dodawanie na wszystkich poziomach i odejmowanie wyłącznie na poziomie 3.
- Dodać generowanie prawdziwych i wiarygodnych fałszywych wyników w ustalonych zakresach.
- Rozdzielić definicje poziomów od parametrów tempa i pojemności planszy.
- Sprawdzić poprawność arytmetyki, zero, graniczne sumy 10 i 100, sumę 20 na poziomach 2 i 3 oraz nieujemność różnicy.

Etap kończy się możliwością rozegrania pełnej partii na każdym z czterech poziomów, z poprawną
oceną wszystkich równań i bez działań spoza wybranego zakresu.

## Etap 3 — interfejs dla dzieci i rodziców

- Przygotować ekran startowy, ustawienia, krótkie wprowadzenie, planszę i podsumowanie.
- Oprzeć wygląd na Czytankach, z niebieską i błękitną paletą oraz czytelnymi oznaczeniami zwierząt.
- Dodać krótkie efekty dźwiękowe i zapamiętywane wyciszenie.
- Dodać dwusekundowy pokaz korekty po błędzie oraz opadanie klocka z przekreślonym błędnym wynikiem i wyróżnionym poprawnym.
- Obsłużyć odrzucenie prawdziwego równania bez przekreślania poprawnego wyniku.
- Dodać pokaz korekty po braku odpowiedzi, także przed podsumowaniem po zapełnieniu kolumny.
- Dodać polskie i angielskie teksty oraz opisane symbole ✓ i ✗.
- Dopracować dotyk, mysz, klawiaturę, widoczny fokus i etykiety dostępności.
- Dodać obsługę profili jak w Czytankach: inicjały, tworzenie, wybór, zmianę nazwy,
  potwierdzane usunięcie i reset oraz ochronę ostatniego profilu.
- Dodać widok rekordów dziecka według poziomu i tempa.
- Powiązać każdą partię z profilem wybranym przy starcie i aktualizować wyłącznie jego właściwy rekord.
- Dodać lokalny zapis profili, rekordów, języka i ustawień pod osobnym kluczem Number Trouble,
  z weryfikacją odczytu i obsługą błędów zapisu.
- Sprawdzić zmianę orientacji ekranu, automatyczną pauzę i wznowienie.

Etap kończy się możliwością wybrania profilu, samodzielnego rozpoczęcia i ponowienia
gry oraz sprawdzenia osobnych rekordów dzieci w obu językach.

## Etap 4 — instalacja i działanie offline

- Dodać manifest PWA, własne ikony i adres startowy aplikacji.
- Przygotować zapis zasobów aplikacji do użycia offline, obejmujący oba języki,
  wszystkie poziomy, fonty, grafiki, ikony i dźwięki lub ich lokalny generator.
- Dodać informację o gotowości do gry bez internetu po ukończeniu zapisu zasobów.
- Zapewnić offline tworzenie i wybór profili oraz odczyt i zapis rekordów.
- Oddzielić pamięć zasobów Number Trouble od Czytanek i obsłużyć publikację pod ścieżką projektu.
- Zapewnić aktualizacje bez przerywania aktywnej partii i bez utraty profili oraz rekordów.

Etap kończy się możliwością zainstalowania produkcyjnej aplikacji i ponownego
uruchomienia jej bez sieci z pełnym zakresem MVP po pierwszym przygotowaniu offline.

## Etap 5 — weryfikacja i dopracowanie

- Testy jednostkowe: arytmetyka, fałszywe wyniki, punktacja, stan stosu, pauza i koniec gry.
- Zweryfikować naliczanie 10, 11, 12 punktów itd., zerowanie serii po błędzie i braku odpowiedzi oraz zachowanie serii podczas pauzy.
- Testy przypadków granicznych: podwójne kliknięcie, kliknięcie podczas lądowania,
  odpowiedź po zakończeniu gry i wznowienie po ukryciu karty.
- Sprawdzić korektę fałszywego równania i odrzucenie prawdziwego, czas pokazu oraz brak kolejnego klocka przed zakończeniem opadania.
- Sprawdzić dostępność wszystkich czterech poziomów i trzech temp od początku.
- Sprawdzić, że siedem błędów lub pominięć pozwala grać dalej, a ósme kończy partię po korekcie.
- Sprawdzić rozdzielenie rekordów według profilu, poziomu i tempa oraz zachowanie rekordu po gorszym wyniku lub remisie.
- Zweryfikować zapis i odczyt profili oraz rekordów, w tym obsługę braku możliwości zapisu.
- Sprawdzić zmianę nazwy, reset i usunięcie jednego profilu, ochronę ostatniego profilu oraz odzyskiwanie niepoprawnego zapisu.
- Sprawdzić efekty dźwiękowe, wyciszenie i działanie gry przy niedostępnym dźwięku.
- Testy przeglądarkowe: start, pełna rozgrywka, przegrana, ponowna gra, zmiana języka i ustawień.
- Testy produkcyjnej aplikacji offline: ponowne otwarcie bez sieci, nieodwiedzone wcześniej
  poziomy i języki, dźwięki, tworzenie profili i zapis rekordów.
- Sprawdzić instalację na docelowym telefonie lub tablecie oraz aktualizację z zachowaniem danych.
- Ręczne próby na rzeczywistym telefonie i tablecie, szczególnie trafianie w ruchome przyciski.
- Krótka wspólna próba z dziećmi: zrozumienie ✓/✗, czytelność, tempo i reakcja na korektę błędu.
- Dostosowanie parametrów do obserwacji i aktualizacja wymagań.
- Sprawdzenie produkcyjnego buildu i opisanie uruchamiania w README.

Etap kończy się spełnieniem uzgodnionych kryteriów akceptacji. Publikacja i wybór
hostingu stanowią osobny krok po przygotowaniu działającej wersji.

## Proponowany kierunek techniczny

Punktem wyjścia może być React, TypeScript i Vite, tak jak w sąsiedniej aplikacji
`czytanki`. Number Trouble powinno mieć własny kod i konfigurację. Technologia
pozostaje propozycją, a nie warunkiem mechaniki gry.

Logikę warto rozdzielić na generator równań, ocenianie odpowiedzi, stan rozgrywki,
upływ czasu i interfejs. Pozwoli to sprawdzać zasady bez zależności od animacji.
Ruch powinien zależeć od upływu czasu i wymiarów logicznej planszy, nie od liczby
wyrenderowanych klatek. Tłumaczenia i parametry trudności powinny być osobnymi danymi.

Do testowania można wykorzystać Vitest i Playwright, które są używane w `czytanki`.
Dobór wersji zależności i szczegóły struktury kodu należą do etapu implementacji.

## Najbliższy krok

Rozpocząć implementację od prototypu z jedną kolumną mieszczącą 8 klocków i jednym
spadającym działaniem naraz. Następnie dostarczyć pozostałe elementy uzgodnionego
MVP zgodnie z etapami 2–5. Parametry trzech temp dostroić podczas prób gry.
