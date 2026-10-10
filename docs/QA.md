# Number Trouble — weryfikacja MVP

Data: 10 października 2026. Implementacja MVP i konfiguracja publikacji GitHub Pages.

## Środowisko

- macOS, Node.js 24.13.0, npm 11.6.2.
- React 19.3.0, TypeScript 5.9.3, Vite 7.3.7, Vitest 4.1.11.
- Playwright 1.64.0, Chromium 156.0.8078.4.
- Produkcyjny `dist/` serwowany pod `http://127.0.0.1:4175/number-trouble/`.
- Emulacja telefonu 390 × 844, małego telefonu 320 × 568, tabletu 768 × 1024
  oraz komputera 1280 × 720. Obrót telefonu do 844 × 390.

## Automatyczna weryfikacja

### Logika — wynik: 23 testy zaliczone

Polecenie: `npm test`.

- 60 000 wygenerowanych równań: dokładne cztery zakresy, całkowite nieujemne
  argumenty i wyniki, prawidłowa arytmetyka, oba operatory poziomu 3, granice 0/10/20/100,
  składniki większe od 10 na poziomie 4, proporcje prawdy/fałszu i brak powtórzeń.
- Cztery kombinacje prawdziwości równania i odpowiedzi; pominięcie to osobne zdarzenie.
- Punkty 10/11/12 = 33, reset serii bez utraty punktów, następne trafienie daje 43.
- Dwusekundowa korekta, opadanie 400 ms i blokada następnego równania przed lądowaniem.
- Podwójne kliknięcia, stary identyfikator klocka, odpowiedź w granicznej chwili lądowania
  i po końcu gry; ósma warstwa kończy grę dopiero po korekcie.
- Pauza zatrzymuje ruch, korektę i przyspieszanie; obliczenia są niezależne od klatek.
- 12 rekordów na dziecko, izolacja profili, remis i gorszy wynik nie zastępują rekordu,
  zmiana nazwy zachowuje dane, reset zachowuje ustawienia, ostatni profil jest chroniony.
- Naprawa błędnych danych, usuwanie duplikatów identyfikatorów, odtwarzanie aktywnego profilu.
- Lokalny generator dźwięków, wyciszenie i niedostępne AudioContext (test z atrapą API).

### Przeglądarka produkcyjna — wynik: 7 scenariuszy zaliczonych

Polecenia: `npm run build`, `npm run test:e2e`.

- Ekran startowy, wszystkie poziomy i tempa, instrukcje, ruch przycisków, punktacja,
  korekta, pauza, pełna partia, podsumowanie, rekord i odczyt po przeładowaniu.
- Dotykowe naciśnięcie przycisku, co najmniej 48 px wysokości pola dotykowego,
  widoczność sterowania przy siedmiu warstwach, obrót, ostatnia korekta po pominięciu,
  ponowna gra i klawiatura.
- Tworzenie i wybór profilu, niezależne ustawienia, zmiana nazwy, anulowanie i zatwierdzanie
  usunięcia/resetu, ochrona ostatniego dziecka; zablokowany localStorage nie blokuje gry.
- Ukrycie dokumentu automatycznie pauzuje; powrót nie wznawia gry samodzielnie.
- Manifest, trzy pliki PNG ikon, własna przestrzeń cache i aktualizacja service workera:
  nowa wersja czeka podczas gry, a jej zastosowanie poza partią zachowuje profile.
- Korekta na tablecie: prawdziwy wynik bez przekreślenia, fałszywy przekreślony,
  poprawny wyróżniony. Plansza mieści się także na ekranie 320 × 568.
- Kontrola axe-core ekranu startowego, planszy z korektą i rekordów po angielsku:
  brak naruszeń po poprawieniu kontrastu, etykiety języka i nagłówka planszy.

### Pełny zakres offline

Test rzeczywiście odłącza sieć w kontekście Chromium po gotowości offline, zamyka kartę
aplikacji i otwiera ją ponownie. To test produkcyjnego service workera, a nie tylko localStorage.

- Zapisane 28 zasobów, w tym obydwa zestawy znaków fontów i ikony.
- Rozpoczęcie gry i poprawna ocena we wszystkich **24 kombinacjach**
  (4 poziomy × 3 tempa × 2 języki), również wcześniej nieotwieranych.
- Utworzenie profilu offline, ukończenie partii z korektami, zapis rekordu i ponowny
  odczyt po przeładowaniu bez sieci.
- Wszystkie dźwięki powstają przez lokalne Web Audio; aplikacja nie pobiera plików audio.
  Odsłuchu na głośnikach rzeczywistego urządzenia nie wykonano.

## Build i spójność

- `npm run build` — zaliczony, TypeScript bez błędów; 28 zasobów w pamięci PWA,
  katalog `dist/` około 652 KiB.
- `npm run format:check` oraz `git diff --check` — zaliczone.
- Lokalne odnośniki dokumentacji — brak nieistniejących celów.
- Kod aplikacji i build nie importują plików z Czytanek ani zasobów zewnętrznych.

## Kontrola wizualna

Sprawdzono zrzuty komputera, tabletu oraz telefonów 390 × 844 i 320 × 568,
w szczególności widok przy siedmiu warstwach i korektę na tablecie.
Korekta nie przekreśla prawidłowego wyniku, a nieprawidłowy wynik pozostaje przekreślony
na stosie. Ruchome przyciski znajdują się nad warstwami i pozostają dostępne.
Zrzuty z testów są w ignorowanym katalogu `test-results/` i powstają przy ponownym teście.

## Przygotowanie publikacji GitHub Pages

- Skonfigurowano workflow na wzór Czytanek: Node.js 24, `npm ci`, formatowanie,
  testy jednostkowe, produkcyjny build, Chromium i oficjalne akcje Pages.
- Zweryfikowano build z `VITE_BASE_PATH=/number-trouble/` oraz scenariusze przeglądarkowe
  pod tą ścieżką, w tym ponowne uruchomienie offline i aktualizację service workera.
- Test odpowiedzi czeka na stan spadania nowego klocka przed odczytem równania,
  eliminując wyścig na końcu krótkiej animacji poprawnej oceny.
- W repozytorium GitHub włączono Pages ze źródłem GitHub Actions i wymuszonym HTTPS.
  Wynik konkretnej publikacji jest dostępny w zakładce Actions repozytorium.

## Ograniczenia — próby niewykonane

- Instalacja i uruchomienie z ikony na **fizycznym** telefonie i tablecie, w tym Safari/iOS.
- Odsłuch efektów i sprawdzenie blokowania dźwięku przez system urządzenia.
- Rzeczywiste trafianie palcem w ruchome przyciski, w tym na wolniejszym urządzeniu.
- Próba z dziećmi: zrozumienie ✓/✗, komfort tempa i czas potrzebny na przeczytanie korekt.
- Testy Firefox/WebKit; automatyka obejmuje Chromium.

Emulacja ekranu i syntetyczny dotyk nie zastępują prób sprzętowych. Parametry tempa
zapisano w wymaganiach i można je dostroić po tych próbach bez zmiany reguł MVP.
