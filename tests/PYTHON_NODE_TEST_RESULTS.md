# Python and Node.js App Creation Test Results

## Summary
Testing Python and Node.js apps with various start commands was successful after fixing the validation schema issue.

### Python Apps ✅
All Python apps were created successfully with different entrypoints:
- **Flask App**: `python app.py`
- **Django App**: `python manage.py runserver 0.0.0.0:$PORT`
- **FastAPI App**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Python Script**: `python server.py`

### Node.js Apps ✅
All Node.js apps were created successfully with different entrypoints:
- **Express App**: `node server.js`
- **Next.js App**: `npm start`
- **Node with PM2**: `pm2 start app.js --no-daemon`
- **Yarn App**: `yarn start`
- **Custom Port**: `node index.js --port=$PORT`

## Key Findings

1. **MCP Tool Usage**: All tests properly use MCP tools exclusively (no direct API/CLI calls)
2. **Dynamic Project Creation**: Tests create their own projects instead of using hardcoded IDs
3. **Proper Cleanup**: Projects are deleted after tests complete
4. **Validation Fixed**: The initial issue was that the MCP server was running with an old build that had incorrect validation schemas

## Test Script Location
`tests/test-python-node-apps.ts`

## Running the Test
```bash
# Make sure to rebuild and restart the server first
npm run build
node build/index.js &

# Then run the test
npx tsx tests/test-python-node-apps.ts
```

## Environment Requirements
- `MITTWALD_API_TOKEN`: Required
- `TEST_SERVER_ID`: Optional (will auto-detect if not provided)
- `SKIP_TEST_CLEANUP`: Optional (set to true to keep test projects)

## Test Results
- 4 Python apps created successfully
- 5 Node.js apps created successfully
- All apps support custom entrypoint/start commands
- The `$PORT` environment variable can be used in start commands

## Next Steps
1. Add these tests to the main test suite
2. Document the entrypoint parameter for custom apps in the main documentation
3. Consider adding more test cases for other common frameworks