# Wydawanie nowej wersji

Zwykłe zmiany dopisujemy do `## Unreleased` w [CHANGELOG.md](../CHANGELOG.md).
Podbicie numeru, zamknięcie tej sekcji i utworzenie tagu są częścią osobnego polecenia
wydania. Wdrożenie na GitHub Pages samo w sobie nie oznacza nowej wersji SemVer.

## Historia i języki

- `CHANGELOG.md` jest po angielsku. Używamy podsekcji `Added`, `Changed`, `Fixed`,
  `Deprecated`, `Removed`, `Security`, `Maintenance`, `Tests`, `Documentation`.
- Historia w aplikacji pochodzi z `src/release-notes.json`. Każdy wpis ma `version`
  oraz sekcje `pl` i `en`, a każda z nich `title` i `changes`. Obie wersje językowe
  opisują korzyści dla użytkownika, bez CI, commitów i innych szczegółów technicznych.
- W aplikacji nie pokazujemy `Unreleased` ani przyszłych wydań. Wpisy do JSON dodajemy
  podczas przygotowania wydania; numery muszą odpowiadać zamkniętym sekcjom changelogu.
- Numer aplikacji pochodzi z `package.json`; musi odpowiadać głównemu `version`
  i `packages[""].version` w `package-lock.json` oraz najnowszemu wpisowi JSON.
- Pierwsze opublikowane MVP ma numer `1.0.0`, z 10 października 2026. Historia
  zaczyna się od tego faktycznie opublikowanego wydania. Dodanie mechanizmu historii
  zmian nie tworzy wstecznie tagu i nie podbija numeru aplikacji.

## Dobór numeru

Stosujemy Semantic Versioning: `MAJOR.MINOR.PATCH`. W changelogu i tagach używamy
prefiksu `v`, a w plikach npm i JSON samego numeru.

| Zmiana                                                                              | Numer | Przykład po 1.0.0 |
| ----------------------------------------------------------------------------------- | ----- | ----------------- |
| Niezgodna wstecz zmiana funkcji lub utrata zgodności zapisanych danych bez migracji | MAJOR | 2.0.0             |
| Nowa funkcja zachowująca zgodność                                                   | MINOR | 1.1.0             |
| Poprawka błędu zachowująca zgodność                                                 | PATCH | 1.0.1             |

Kontraktem kompatybilności są funkcje gry i zachowanie profili, rekordów oraz ustawień.
Bezstratna migracja formatu zapisu zachowuje zgodność. Dla zestawu zmian wybieramy
najwyższy wymagany poziom. Samodzielne wydania dokumentacji, testów lub porządków
przyjmują PATCH. Wersja przedpremierowa może mieć postać `1.1.0-rc.1`.
Nie używamy ponownie wydanych numerów i nie przesuwamy istniejących tagów.

## Przygotowanie wydania

1. Sprawdź stan Git, tagi, ostatnie wydanie i zgodność obu plików npm. Porównaj
   `Unreleased` z faktycznymi zmianami od ostatniego wydania. Nie dołączaj przypadkowych
   zmian lokalnych. Zmiany zależności nie są częścią samego podbicia numeru.
2. Wybierz wersję według powyższych zasad. Przenieś gotowe wpisy do nowej sekcji
   `## vX.Y.Z — YYYY-MM-DD` z rzeczywistą datą. Pozostaw pustą sekcję `## Unreleased`
   na górze. Zachowaj starsze numery, daty i opisy zakresu.
3. Dodaj na początku `src/release-notes.json` wpis tej wersji w obu językach.
   Przetłumacz i skróć angielski changelog do opisów przydatnych graczowi.
4. Zaktualizuj wyłącznie metadane wersji:

   ```sh
   npm version X.Y.Z --no-git-tag-version
   ```

5. Wykonaj sprawdzenia:

   ```sh
   npm run format:check
   npm test
   VITE_BASE_PATH=/number-trouble/ npm run build
   npm run test:e2e
   git diff --check
   ```

   Testy sprawdzają SemVer, spójność metadanych, historię w obu językach, okno nowości,
   zachowanie istniejących danych i działanie offline. Przejrzyj również same teksty:
   test obecności tłumaczenia nie sprawdza jakości języka. Zapisz wyniki i ograniczenia
   w `docs/QA.md`; nie przepisuj wyników starej wersji jako nowych.

6. Sprawdź wersję i historię w stopce. Zasymuluj `lastLaunchedVersion` poprzedniego
   wydania w testowej przeglądarce. Nowości obejmują pominięte wydania, pojawiają się
   raz po aktualizacji, a nie przy pierwszym uruchomieniu, powtórnym uruchomieniu tej
   samej wersji lub rollbacku. Metadane są wspólne dla profili; zmiana profilu nie
   powtarza powiadomienia. Przy zablokowanym zapisie działa dotychczasowy komunikat błędu.

## Oznaczenie i publikacja

Przy poleceniu samego przygotowania zakończ na gotowych zmianach. Jeśli zakres obejmuje
wydanie i publikację:

1. Utwórz commit `chore: release vX.Y.Z` oraz adnotowany tag `vX.Y.Z` na sprawdzonym commicie.
2. Wypchnij commit na `master` i konkretny tag. Push na `master` uruchamia workflow
   GitHub Pages; sam tag nie wdraża strony. Projekt ma `private: true`; nie używamy `npm publish`.
3. Poczekaj na pomyślne wdrożenie i sprawdź
   [Number Trouble](https://bukowskiadam.github.io/number-trouble/), także offline.
   Podaj wersję, commit/tag, wyniki testów i status publikacji.
