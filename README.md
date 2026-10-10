# Number Trouble

Gra do ćwiczenia matematyki, w MVP skupiona na dodawaniu i odejmowaniu. Dziecko ocenia
prawdziwość spadających działań, zdobywa punkty i próbuje zapobiec zapełnieniu planszy.

MVP obejmuje cztery gotowe poziomy: dodawanie z sumą do 10, dodawanie dwóch liczb
od 0 do 10, dodawanie i odejmowanie liczb od 0 do 10 z nieujemnym wynikiem oraz
dodawanie z sumą do 100. Mnożenie, dzielenie i własne zakresy pozostają na później.

Wszystkie poziomy są dostępne od początku z trzema tempami: żółw, koń i gepard.
MVP obejmuje polski i angielski interfejs oraz profile dzieci z osobnymi rekordami
dla każdej kombinacji poziomu i tempa. Po błędzie lub braku odpowiedzi gra pokazuje
poprawne równanie przez około 2 sekundy.

Profile działają jak w Czytankach i są zapisywane lokalnie, niezależnie od danych
aplikacji do czytania. Kolejne poprawne odpowiedzi w serii dają 10, 11, 12 punktów
itd., z osobnym licznikiem streak. Planowana oprawa nawiązuje do Czytanek, ale używa
niebieskich i błękitnych kolorów oraz krótkich efektów dźwiękowych z wyciszeniem.

Plansza mieści 8 klocków. MVP ma działać offline po pierwszym pełnym załadowaniu
i umożliwiać instalację na ekranie głównym jako PWA.

Zakres MVP jest ustalony, a plan gotowy do realizacji. Projekt nie zawiera jeszcze implementacji.

## Dokumentacja

- [Start implementacji](docs/IMPLEMENTATION.md) — stan projektu, wzorce z Czytanek i gotowa wiadomość do nowej rozmowy.
- [Wymagania](docs/REQUIREMENTS.md) — ustalony zakres MVP, zasady i kryteria akceptacji.
- [Plan realizacji](docs/PLAN.md) — kolejność prac i kryteria zakończenia etapów.
- [Instrukcje dla agentów](AGENTS.md) — konwencje pracy i weryfikacji.
- [Historia zmian](CHANGELOG.md) — wykonane zmiany w projekcie.

## Kontynuacja w nowej rozmowie

Otwórz katalog `number-trouble` jako projekt i użyj wiadomości z końca
[instrukcji rozpoczęcia implementacji](docs/IMPLEMENTATION.md). Dokumentacja zawiera
pełny kontekst potrzebny do rozpoczęcia prac, bez ponownego wywiadu produktowego.

Projekt znajduje się obok aplikacji `czytanki`, w osobnym katalogu `number-trouble`.
Przyjęta nazwa to **Number Trouble**; osobnej polskiej nazwy jeszcze nie ustalono.
