#####################################################################################
dist_dir=$(CURDIR)/deploy
service=polis-gui
version?=dev
#####################################################################################
########### DOCKER ##################################################################
tag=airenas/$(service):$(version)

dbuild: 
	cd ../.. && docker buildx build -t $(tag) --build-arg BUILD_VERSION=$(version) -f ./build/docker/Dockerfile ./
dpush: dbuild
	docker push $(tag)
dscan: dbuild	
	docker scan --accept-license $(tag)
########### END #####################################################################
.PHONY:
	dbuild dpush dscan
