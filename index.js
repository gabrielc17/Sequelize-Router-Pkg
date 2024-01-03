'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const logger = require('../../logger');
const BuildRouter = require('./src/build-router');

function validatePath(dir) {
    for (const field of Object.keys(dir)) {
        if (!fs.existsSync(dir[field])) {
            throw new Error(`${field} path not found`);
        }
        const partOfPath = dir[field].split('/');
        if (partOfPath[partOfPath.length - 1] !== field.toLowerCase()) {
            throw new Error(`Invalid ${field} path`);
        }
    }
    return true;
}

function RoutesByModel(pathModels, pathControllers) {
    const dirToValidate = {
        'Models': pathModels,
        'Controllers': pathControllers
    };
    validatePath(dirToValidate);
    const Models = require(pathModels);
    const Controllers = require(pathControllers);
    const routes = [];
    for (const field of Object.keys(Models)) {
        if (field[0] === field[0].toLowerCase()) {
            continue;
        }
        const modelRouter = new BuildRouter(Models[field], Controllers[field] || null, router, logger);
        routes.push(modelRouter._build());
    }
    return routes;
}

module.exports = RoutesByModel;
