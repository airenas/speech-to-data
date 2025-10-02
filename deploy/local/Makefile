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

run: 
	docker compose up -d 

clean:
	docker compose down

_redeploy/%:
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
.PHONY: 
.EXPORT_ALL_VARIABLES:
