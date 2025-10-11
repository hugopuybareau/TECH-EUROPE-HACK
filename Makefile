.PHONY: install

# Install backend and frontend deps with a local backend venv
install:
	# Ensure uv is available (optional bootstrap)
	@command -v uv >/dev/null 2>&1 || (echo "Installing uv..." && curl -LsSf https://astral.sh/uv/install.sh | sh)
	# Create venv under webapp/backend using Python 3.13 (avoid conda)
	cd webapp/backend && \
		uv venv -p python3.13 .venv && \
		uv pip install --python .venv/bin/python -e .
	# Install frontend dependencies
	cd webapp/frontend && npm install
