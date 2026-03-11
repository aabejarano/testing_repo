FROM mitmproxy/mitmproxy:latest

# Expose the proxy port and the mitmweb UI port
EXPOSE 8080 8081

# mitmweb: interactive web UI so you can inspect all proxied traffic at
# http://localhost:8081  (host-mapped port)
CMD ["mitmweb", \
     "--listen-host",  "0.0.0.0", \
     "--listen-port",  "8080", \
     "--web-host",     "0.0.0.0", \
     "--web-port",     "8081"]
