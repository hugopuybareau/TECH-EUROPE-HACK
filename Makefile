.PHONY: install

# Install backend dependencies using uv and a local venv
install:
	cd webapp/backend && \
		uv venv && \
		uv pip install --python .venv/bin/python -e .

