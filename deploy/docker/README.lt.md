# Diegimas naudojant *Docker*

## Apie

`Realaus laiko atpažintuvo` diegimas yra realizuotas *Docker* komponentais. Visa sistema sukonfigūruota ir paruošta paleisti su *docker compose* konfigūraciniu failu.


## Reikalavimai

### Aparatūrai

| Komponen-tas | Min reikalavimai (1 darbo vieta) | 2 darbo vietos | 3 darbo vietos |
| -----------------|------------------|---------------------|-----------------------|
| Platform | x86_64 | | | 
| CPU | 64-bit, 20 branduolių | 36 | 52 |
| HDD | 40 Gb | | |
| RAM | 12 Gb | 20Gb  | 28Gb|

### Programinei įrangai

#### OS

Linux OS 64-bit (papildomai žiūrėkite [reikalavimus Docker instaliacijai](https://docs.docker.com/engine/install/)). Reckomenduojama `Debian Bookworm 12 (stable)`. 


#### Kiti

| Komponentas | Min versija | URL |
| ---|-|-|
| Docker | 27.0.3 | [Link](https://docs.docker.com/engine/install/)

Papildomi įrankiai naudojami instaliuojant: [make](https://www.gnu.org/software/make/manual/make.html), [wget](https://www.gnu.org/software/wget/manual/wget.html), [tar](https://www.gnu.org/software/tar/manual/).

### Tinklas

- Pasiekiami port'ai: `443`, `80`.
- Diegimui prisijungimas per ssh: portas `22`
- Domenas

### Vartotojas

Vartotojas kuris diegia, turi turėti `root` teises.

## Prieš diegiant

Patikrinkite ar visi reikalingi komponentai veikia mašinoje:

```bash
    ## Docker
    docker run hello-world
    docker system info
    ## Kiti komponentai
    make --version
    tar --version
    wget --version
```   
 
Ar domenas sukonfigūruotas teisingai. Patikriname iš kitos mašinos:
```bash
    dig <domain>
```

## Diegimas

...TODO
