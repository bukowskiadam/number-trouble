# Instrukcje dla agentów

## Rozpoczęcie pracy

- To osobny projekt **Number Trouble**. Pracuj w tym repozytorium; sąsiednie `czytanki`
  jest źródłem wzorców wyglądu i obsługi profili.
- Przed implementacją przeczytaj [wymagania](docs/REQUIREMENTS.md),
  [plan](docs/PLAN.md) i [instrukcję rozpoczęcia implementacji](docs/IMPLEMENTATION.md).
- Zakres MVP został ustalony z użytkownikiem. Nie powtarzaj wywiadu produktowego.
  Rutynowe szczegóły wykonania i parametry tempa dobierz podczas implementacji,
  dokumentując wybór. Nowe polecenia użytkownika mają pierwszeństwo przed dokumentacją.
- Zachowaj szczególnie cztery dokładne zakresy działań, ruchome przyciski,
  pojedynczą kolumnę na 8 klocków, streak, korekty odpowiedzi oraz pełny tryb offline.

## Konwencje

- Dokumentację produktu prowadź po polsku; nazwy w kodzie i komentarze techniczne po angielsku.
- Interfejs ma być kompletny po polsku i angielsku. Teksty przechowuj osobno od logiki gry.
- Kierunek techniczny: React, TypeScript i Vite oraz Vitest i Playwright, podobnie jak
  w Czytankach. Wybierz kompatybilne zależności i zapisz lockfile podczas tworzenia aplikacji.
- Oddziel generator równań, logikę punktacji i stanu gry od renderowania i animacji.
- Używaj własnych kluczy danych, pamięci offline i zasobów Number Trouble.
  Nie uzależniaj działania ani budowania aplikacji od obecności katalogu `czytanki`.
- Nie przenoś do MVP funkcji Czytanek, które nie wynikają z wymagań tej gry.

## Dokumentacja zmian i sprawdzanie

- Każdy zestaw zmian opisz krótko w `CHANGELOG.md`, po angielsku, w sekcji `## Unreleased`.
  Opisuj wykonane zmiany, nie planowane funkcje. Nie oznaczaj dokumentacji wymagań jako gotowej aplikacji.
- Aktualizuj README i plan zgodnie z rzeczywistym stanem projektu.
- Weryfikuj logikę generatora, punktację i streak, granice lądowania, pauzę oraz oddzielenie profili.
- Sprawdź widoki telefonu i komputera, ruchome przyciski, dwie wersje językowe,
  korekty, zapis rekordów i produkcyjny tryb offline. Testy dobieraj do zakresu zmiany.
- Wyniki weryfikacji aplikacji zapisz w `docs/QA.md`, gdy rozpoczniesz implementację.
  Oddziel wyniki testów automatycznych od niewykonanych prób na rzeczywistych urządzeniach.
- Dla samych zmian dokumentacyjnych wystarczy sprawdzenie spójności, lokalnych linków
  i `git diff --check`; nie instaluj zależności aplikacji tylko w tym celu.
