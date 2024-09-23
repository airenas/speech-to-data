## Design

```mermaid
sequenceDiagram
    participant user as Browser
    participant waf
    participant auth_proxy
    participant auth as VMI admin3ws
    participant redis
    participant asr
    
    Note over user,asr: Authorizacija

    user->>waf: connect (user,pass)
    waf->auth_proxy: 
    auth_proxy->> auth: /authenticate_details/rt-transcriber/user/pass
    auth -->> auth_proxy: code, vartotojo vardas, pavarde
    auth_proxy-> auth: /get_permissions/rt-transcriber/user
    auth -->> auth_proxy: ALLOW_TRANSCRIBE
    auth_proxy->> auth_proxy: create sessions (max: 8h, inactivity 15m)
    auth_proxy->> redis: store encrypted data (key: ip + session_id)
    redis --> auth_proxy: 
    auth_proxy -->> waf: logged, sesssion_id, vart vardas, pav
    waf -->> user: logged, sesssion_id, vart vardas, pav


    Note over user,asr: Atpažinimas
    user->>waf: session_id, data
    waf->auth_proxy: session_id, data
    auth_proxy->> redis: auth_proxy->> redis: get session (key: ip + session_id)
    redis --> auth_proxy: 
    auth_proxy->> auth_proxy: validate sessions (max: 8h, inactivity 15m)
    auth_proxy->> asr: data
    asr -->> auth_proxy: res
    auth_proxy -->> waf: res
    waf -->> user: res
```    



```mermaid
graph LR
    subgraph policija.lt
        user1[user1]
        user2[user2]
        waf[WAF]
        auth[admin3ws]
        subgraph pd-di-identify
            auth_proxy[auth_proxy]
            redis[redis]
            rtasr[transcriber]
        end
    end
    user1 <--> |https, wss| waf
    user2 <--> |https, wss| waf
    waf <--> |https, wss| auth_proxy
    auth_proxy --> |https| auth
    auth_proxy <--> |http, encrypted data, storing session| redis
    auth_proxy <--> |http, ws| rtasr