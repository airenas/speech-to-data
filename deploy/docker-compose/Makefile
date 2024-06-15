########################################################################################################
## print usage information
help:
	@echo 'Usage:'
	@cat ${MAKEFILE_LIST} | grep -e "^## " -A 1 | grep -v '\-\-' | sed 's/^##//' | cut -f1 -d":" | \
		awk '{info=$$0; getline; print "  " $$0 ": " info;}' | column -t -s ':' | sort
########################################################################################################
########################################################################################################
install: run	
########################################################################################################
status: 
	docker compose ps

run: init
	docker compose up -d 
init: .env
.PHONY: init	

clean:
	docker compose down

stop:
	docker compose stop $(srv)

## _logs/xxx provides service log
_logs/%:
	docker compose logs -f $*	
logs/manager: _logs/manager
logs/worker: _logs/worker
logs/wrapper: _logs/wrapper
logs/phones2word: _logs/phones2word
logs/punctuation: _logs/punctuation
logs/tensorflow: _logs/tensorflow

## _redeploy/xxx redeploys one service
_redeploy/%: init
	docker compose up --detach --build $*
redeploy/manager: _redeploy/manager
redeploy/punctuation: _redeploy/punctuation
redeploy/tensorflow: _redeploy/tensorflow
redeploy/gui: _redeploy/polis-gui
redeploy/norm-num: _redeploy/norm-num
redeploy/phones2word: _redeploy/phones2word
redeploy/wrapper: _redeploy/wrapper
redeploy/worker: 
	docker compose up --detach --build --scale worker=1 worker
restart/worker: 
	docker compose restart worker	
########################################################################################################
dwn_url=https://semantikadocker.vdu.lt/models
$(punctuation_volume)/models:
	mkdir -p $@		
########################################################################################################
$(punctuation_volume)/.%.dwn: | $(punctuation_volume)/models
	wget --no-check-certificate -O $(punctuation_volume)/$*.tar.gz $(dwn_url)/$*.tar.gz	
	touch $@
$(punctuation_volume)/.%.data.extracted: $(punctuation_volume)/.%.dwn | $(punctuation_volume)/models
	tar xvzf $(punctuation_volume)/$*.tar.gz -C $(punctuation_volume)/models
	touch $@
########################################################################################################
install/punctuation: $(punctuation_volume)/.punctuation-2.0.data.extracted
########################################################################################################


.PHONY: 
.EXPORT_ALL_VARIABLES:
