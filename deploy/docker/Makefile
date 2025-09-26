include Makefile.options
########################################################################################################
data_dir?=./data
# dwn_url=https://prn509.vdu.lt/models/share
dwn_url=https://localhost:443/models/share
worker_count?=1
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
	docker compose up -d --scale worker=${worker_count}
.PHONY: run	
init: .env traefik/traefik.toml traefik/rules.toml ${data_dir}/.punctuation.extracted ${data_dir}/.asr.extracted
.PHONY: init	

clean:
	docker compose down
	rm -rf data

stop:
	docker compose stop

## _logs/xxx provides service log
_logs/%:
	docker compose logs -f $*	
logs/gui: _logs/gui

## _redeploy/xxx redeploys one service
_redeploy/%: init
	docker compose up --detach --build $*
redeploy/proxy: _redeploy/proxy
########################################################################################################
.env: .env.in Makefile.options
	cat $< | envsubst > $@
traefik/traefik.toml: traefik/traefik.toml.in Makefile.options
	cat $< | envsubst > $@
traefik/rules.toml: traefik/rules.toml.in Makefile.options
	cat $< | envsubst > $@
########################################################################################################
${data_dir}/.punctuation.extracted: ${data_dir}/.punctuation.dwn | $(data_dir)/models
	tar xvzf $(data_dir)/.dwn/punctuation-3.0.tar.gz -C $(data_dir)/models/
	touch $@

${data_dir}/.punctuation.dwn: | ${data_dir}/.dwn
	wget --user user --password ${share_pass} --no-check-certificate -O $(data_dir)/.dwn/punctuation-3.0.tar.gz $(dwn_url)/punctuation-3.0.tar.gz
	touch $@
########################################################################################################
${data_dir}/.asr.extracted: ${data_dir}/.asr.dwn | $(data_dir)/models
	tar xvzf $(data_dir)/.dwn/asr-4.0.tar.gz -C $(data_dir)/models/
	touch $@

${data_dir}/.asr.dwn: | ${data_dir}/.dwn
	wget --user user --password ${share_pass} --no-check-certificate -O $(data_dir)/.dwn/asr-4.0.tar.gz $(dwn_url)/asr-4.0.tar.gz
	touch $@
########################################################################################################
$(data_dir) $(data_dir)/.dwn $(data_dir)/models:
	mkdir -p $@		
########################################################################################################
.EXPORT_ALL_VARIABLES:
########################################################################################################

