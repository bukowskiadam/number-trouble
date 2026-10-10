# Number Trouble — start implementacji

Zakres MVP jest ustalony. Ten dokument pozwala rozpocząć implementację w nowej
rozmowie bez dostępu do wywiadu z użytkownikiem.

## Stan przekazania

- Repozytorium zawiera wymagania, plan, instrukcje pracy i początkowy changelog.
- Nie ma jeszcze kodu aplikacji, `package.json`, zależności ani testów aplikacji.
- Etap 0 planu jest zakończony. Do wykonania pozostają etapy 1–5.
- Nie ma ustalonego miejsca publikacji. Lokalna implementacja i weryfikacja nie wymagają
  wyboru hostingu; aplikacja ma wspierać publikację w osobnej ścieżce.

## Kolejność czytania

1. [AGENTS.md](../AGENTS.md) — instrukcje pracy w repozytorium.
2. [REQUIREMENTS.md](REQUIREMENTS.md) — źródło ustalonych zasad i kryteriów akceptacji.
3. [PLAN.md](PLAN.md) — kolejność prac nad MVP.

Wymagania zawierają rozstrzygnięcia produktowe. Szczegóły oznaczone jako propozycje
można dopracować w implementacji bez kolejnej rundy pytań o zatwierdzony zakres.

## Najważniejsze ustalenia

- Jedno spadające działanie naraz, z przyciskami ✓ i ✗ poruszającymi się pod nim.
- Jedna szeroka kolumna na 8 klocków. Błąd i brak odpowiedzi zajmują po jednym miejscu;
  poprawna ocena usuwa aktywny klocek. Ósmy zajęty klocek kończy grę.
- Cztery poziomy dostępne od początku: dodawanie z sumą do 10; dodawanie dwóch liczb
  0–10; dodawanie i odejmowanie dwóch liczb 0–10 z nieujemnym wynikiem; dodawanie z sumą do 100.
- Trzy niezależnie wybierane tempa: żółw, koń i gepard. Prędkość rośnie podczas gry,
  a stos dodatkowo skraca drogę i czas na odpowiedź.
- Streak jest osobnym licznikiem. Kolejne trafne oceny dają 10, 11, 12… punktów.
  Błąd i brak odpowiedzi przerywają serię, ale nie odejmują punktów.
- Korekta po błędzie trwa około 2 sekundy: zły wynik przekreślony, dobry wyróżniony.
  Potem klocek opada z korektą. Po braku odpowiedzi korekta następuje po lądowaniu,
  przed kolejnym klockiem lub podsumowaniem. Odrzucenie prawdziwego równania nie
  powoduje przekreślenia poprawnego wyniku.
- Profile jak w Czytankach, z lokalnym zapisem i osobnym rekordem dla każdej
  kombinacji dziecka, poziomu i tempa. To 12 kombinacji dla jednego dziecka.
- Polski i angielski, wygląd zbliżony do Czytanek w błękitnej palecie,
  dźwięki z możliwością wyciszenia.
- Instalowalna PWA: po przygotowaniu offline wszystkie poziomy, języki, zasoby,
  dźwięki, profile i rekordy działają bez internetu.

## Wzorce z Czytanek

Czytanki znajdują się obok repozytorium, w `../czytanki` względem jego katalogu
głównego. Korzystaj z nich jako materiału referencyjnego:

| Wzorzec | Pliki |
| --- | --- |
| Zachowanie profili | [PROFILES.md](../../czytanki/docs/PROFILES.md) |
| Dane i zapis profili | [profiles.ts](../../czytanki/src/profiles.ts), [useProfiles.ts](../../czytanki/src/useProfiles.ts) |
| Wybór i usuwanie profilu | [ProfileManager.tsx](../../czytanki/src/components/ProfileManager.tsx) |
| Typografia, kolory, karty i układ | [styles.css](../../czytanki/src/styles.css), [App.tsx](../../czytanki/src/App.tsx) |
| Okna dialogowe | [Dialog.tsx](../../czytanki/src/components/Dialog.tsx) |
| Produkcyjna pamięć offline | [build-sw.mjs](../../czytanki/scripts/build-sw.mjs) |
| Zależności i polecenia | [package.json](../../czytanki/package.json) |

Te odnośniki działają w obecnym układzie katalogów. Przy pracy z samym repozytorium
Number Trouble wymagania nadal wystarczają do implementacji. Nie kopiuj mechanicznie
treści edukacyjnych, danych dzieci, tożsamości PWA ani ustawień wdrożenia Czytanek.

## Pierwsze prace

1. Sprawdź stan Git i utwórz projekt React/TypeScript/Vite w istniejącym katalogu,
   zachowując dokumentację. Dodaj npm lockfile, podstawowe polecenia uruchomienia,
   budowania i testowania oraz odpowiednią konfigurację.
2. Zbuduj logikę gry i generator osobno od widoku. Umożliw kontrolowanie losowości
   i upływu czasu w testach, żeby sprawdzić granice lądowania i punktację.
3. Zbuduj grywalną planszę oraz ustawienia poziomu i tempa. Zadbaj o czytelne
   przyciski i miejsce na ocenę ósmego działania przy niemal pełnym stosie.
4. Realizuj kolejne etapy planu, łącznie z profilami, rekordami, językami,
   dźwiękami, PWA i testami offline. Sam prototyp mechaniki nie wyczerpuje zakresu MVP.
5. Zapisz użyte polecenia, wyniki testów i ograniczenia w README i raporcie QA.

Dobierz samodzielnie początkowe prędkości i przyspieszanie, wiarygodne błędne wyniki,
konkretne odcienie niebieskiego oraz szczegóły animacji. Zapisz wybrane parametry
w dokumentacji. Pojemność 8, zakresy liczb i reguły punktacji są już ustalone.

## Gotowa wiadomość do nowej rozmowy

> Zaimplementuj pełne MVP Number Trouble w tym repozytorium. Najpierw przeczytaj
> AGENTS.md, docs/IMPLEMENTATION.md, docs/REQUIREMENTS.md i docs/PLAN.md. Zakres
> produktu jest już ustalony — przejdź do realizacji, dobierając samodzielnie
> pozostałe parametry prototypu. Wzoruj profile i stylistykę na sąsiednich Czytankach,
> zachowując niebieską paletę i niezależne dane. Doprowadź do działającej aplikacji
> z testami oraz sprawdzonym produkcyjnym trybem offline. Aktualizuj dokumentację
> i changelog, a na końcu podaj sposób uruchomienia oraz wyniki weryfikacji.
