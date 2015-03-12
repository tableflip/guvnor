FROM debian:latest

# Update package list and install node.js
RUN apt-get update
RUN apt-get install -y curl build-essential git python libavahi-compat-libdnssd-dev
RUN cd /usr/local; curl http://nodejs.org/dist/v0.12.0/node-v0.12.0-linux-x64.tar.gz | tar -xzv
RUN ln -s /usr/local/node-v0.12.0-linux-x64 /usr/local/node
RUN echo PATH=$PATH:/usr/local/node/bin > /etc/profile
ENV PATH /usr/local/node/bin:$PATH

# Install package and copy config files
RUN npm install -g guvnor --unsafe-perm
#ADD ./docker/config/guvnor /etc/guvnor/guvnor
#ADD ./docker/config/users.json /etc/guvnor/users.json
#ADD ./docker/config/processes.json /etc/guvnor/processes.json

CMD ["guv", "--daemonise=false"]
