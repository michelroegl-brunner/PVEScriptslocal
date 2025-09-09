#!/bin/bash

echo "Hello from test script!"
echo "Current directory: $(pwd)"
echo "Script arguments: $@"
echo "Environment variables:"
env | grep -E "(PATH|HOME|USER)" | head -5

for i in {1..5}; do
    echo "Count: $i"
    sleep 1
done

echo "Test script completed!"
