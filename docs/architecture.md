# Realaus laiko transkribatorius

## Aprašymas

Sistema:
- naršyklėje įrašo garsą iš mikrofono
- realiu laiku transkribuoja ir pateikia vartotojui atpažintą tekstą
- leidžia balso komandomis valdyti atpažinimo pradžią, pabaigą
 

### Realizacija

Sistema remiasi [Kaldi atpažinimo varikliu](https://github.com/alumae/kaldi-gstreamer-server). Sukurti papildomi komponentai, kurie skirti lietuvių kalbos skyrybos ženklų atstatymui, teksto koregavimui. Kad būtų paprasčiau diegti, visi komponentai realizuoti docker konteineriais.

### Komponentai

Sistemą sudaro šie komponentai:

| Pavadinimas         | Paskirtis                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| proxy (Traefik)     | Proxy servisas, paskirsto užklausas tarp sistemos servisų, leidžia pasiekti servisus iš išorės, gali būti naudojamas autorizavimui užtikrinti |
| manager             | Kaldi pagrindinis serveris, koordinuoja transkribavimo darbus                                                                                 |
| worker              | Kaldi atpažinimo serveris, atlieka realų transkribavimą. Gali būti paleidžiami keli atpažinimo serveriai                                      |
| wrapper             | Papildomas tarpinis servisas, kuriame papildomai apdorojamas grąžintas tekstas                                                                |
| redis               | Redis talpykla, naudojama laikinam audio duomenų ir atpažinto teksto saugojimui. Saugomi šifruoti duomenys                                    |
| authware            | Vartotojų autentifikavimo ir autorizavimo servisas                                                                                            |
| tensorflow          | Tensorflow Serving, skirtas skyrybos ženklų modeliui aptarnauti                                                                               |
| punctuation-service | Servisas, atkuriantis skyrybos ženklus transkribuotame tekste                                                                                 |
| norm-num            | Skaičių normalizavimo servisas                                                                                                                |
| phones2word         | Fonemų į žodžius konvertavimo servisas                                                                                                        |
| rt-transcriber-gui  | Naršyklės vartotojo sąsaja (frontend)                                                                                                         |

## Procesų diagramos

### Autorizacijos pavyzdys

```mermaid
sequenceDiagram
    participant user as Naršyklė
    box blue app-vm
    participant auth_proxy
%%    participant redis
    end
    participant auth as External auth
    
    user->>auth_proxy: connect (user,pass)
    auth_proxy->> auth: /authenticate(user,pass)
    auth -->> auth_proxy: vartotojo vardas, pavarde, id
    auth_proxy->> auth_proxy: create session (max: 6h, inactivity 30m) + ip
%%    auth_proxy->> redis: store encrypted data (key: ip + session_id)
%%    redis --> auth_proxy: 
    auth_proxy -->> user: logged, sesssion_id, vart vardas, pav.
```    

### Kreipinys į atpažintuvą

```mermaid
sequenceDiagram
    participant user as Naršyklė
    box blue app-vm
    participant auth_proxy
%%    participant redis
    participant asr as Atpažintuvas
    end
    
    user->>auth_proxy: session_id, data
%%    auth_proxy->> redis: auth_proxy->> redis: get session (key: ip + session_id)
%%    redis --> auth_proxy: 
    auth_proxy->> auth_proxy: validate sessions (max: 6h, inactivity 30m) + ip
%%    auth_proxy->> redis: mark last used time
%%    redis -->> auth_proxy: 
    auth_proxy->> asr: data
    asr -->> auth_proxy: res
    auth_proxy -->> user: res
```   

### Detali atpažinimo proceso schema (be autentifikavimo)

```mermaid
sequenceDiagram
    participant user as Naršyklė
    participant wrapper
    participant norm-num
    participant punctuation-service
    participant manager
    participant worker
    participant phones2word
%%    participant tensorflow

    par Siunčiami garso įrašo fragmentai
    loop Kol įrašinėjama
        user->>wrapper: audio data
        wrapper->>manager: audio data
        manager->>worker: audio data
    end
    and Siunčiamas tekstas
    loop kol atpažįstama
        worker-->>phones2word: phonemos
        phones2word->>worker: žodžiai
        worker-->>manager: tekstas
        manager->>wrapper: tekstas
        wrapper->> norm-num: tekstas
        norm-num-->> wrapper: 
        wrapper->> punctuation-service: tekstas
        punctuation-service -->> wrapper: 
        wrapper->> user: spėjimas
    end
    end

```   

## Komponentų diegimo pavyzdys

```mermaid
graph LR
        user[user]
        auth[Išorinis autorizacijos servisas]
        subgraph vm
           subgraph docker
             subgraph  
                traefik[traefik proxy]
                authware
                web[rt-transcriber-gui]
                tensorflow
                norm-num
                wrapper
                redis-cache
                phones2word
                punctuation
                redis[redis]
            end
             subgraph kaldi atpažintuvas
                manager
                worker[worker 1]
                worker2[worker 2]
                workerN[worker N]
             end   
            end
        end
    user --> |https, wss| traefik
    traefik --> |https, autorizacija| authware
    traefik --> |http| web
    traefik --> |http, ws| wrapper
    authware --> |https, autorizacija| auth
    authware --> |tcp, sesijų saugykla, koduoti duomenys| redis

    wrapper --> |ws| manager
    manager --> |ws| worker
    worker --> |http| phones2word
    manager --> |ws| worker2
    worker2 --> |http| phones2word
    manager --> |ws| workerN
    workerN --> |http| phones2word
 
    wrapper --> |http|norm-num
    wrapper --> |http|punctuation
    punctuation --> |http|tensorflow
    wrapper --> |tcp|redis-cache
```
