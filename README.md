# LogAsJSON

[![NPM Version](https://img.shields.io/npm/v/logasjson.svg)](https://www.npmjs.com/package/logasjson)
[![Downloads](https://img.shields.io/npm/dm/logasjson.svg)](https://www.npmjs.com/package/logasjson)
[![Build & Test](https://github.com/ml1nk/logasjson/actions/workflows/publish.yml/badge.svg)](https://github.com/ml1nk/logasjson/actions/workflows/publish.yml)

LogAsJSON is a small logging library and implements
 - Forking - Every module or even object can get a forked logger with addtional configuration.
 - Context - Easy to integrate with Async Local Storage and usage of trace ids.
 - JSON - Resolves cycles and supports errors and stack traces.
 - Override - Mechanism to change the log level for all forks at once.

The destinations to log to stdout/stderr and loki are bundled.

## Installation
~~~ts
npm install logasjson
~~~

## Basic Usage

TODO

## Documentation

The documentation is build with TypeDoc and hosted on GitHub Pages at [https://ml1nk.github.io/logasjson](https://ml1nk.github.io/logasjson).
