'use strict';

const ROUTER_MODEL_LIMIT = parseInt(process.env.ROUTER_MODEL_LIMIT) || 50;
const ROUTER_MODEL_SORT_TOTAL = parseInt(process.env.ROUTER_MODEL_SORT_TOTAL) || 50;

class SequelizeRouter {
    constructor(_model, _controller, _router, _logger) {
        this.model = _model;
        this.router = _router;
        this.logger = _logger;
        this.controller = _controller;
    }

    _filterQuery(req, res, next) {
        const validQueries = ['limit', 'skip', 'sort', 'conditions'];
        req.filterQuery = {};
        for (const field of validQueries) {
            if (!req.query[field]) {
                delete req.query[field];
            }
        }
        return next();
    }
    
    _validatePagination(req, res, next) {
        try {
            if (!req.query['skip']) {
                req.filterQuery['offset'] = 0;
            }
            if (!req.query['limit']) {
                req.filterQuery['limit'] = ROUTER_MODEL_LIMIT;
                return next();
            }
            for (const field of ['limit', 'skip']) {
                // eslint-disable-next-line no-cond-assign
                if (isNaN(req.query[field] = Number(req.query[field]))) {
                    throw new Error(`Invalid ${field}`);
                }
                if (req.query[field] < 0) {
                    throw new Error(`Invalid value_${field}`);
                }
                if (field === 'limit' && req.query[field] > ROUTER_MODEL_LIMIT) {
                    throw new Error('Limit exceeded');
                }
            }
            req.filterQuery['limit'] = req.query['limit'];
            req.filterQuery['offset'] = req.query['skip'];
            return next();
        } catch(error) {
            let message = error;
            if (error && error.message) {
                this.logger.error(`Class ModelRouter. Error in _validatePagination - ${error}`);
                message = error.message;
            }
            return res.status(400).json({
                code: error.toLowerCase().replaceAll(' ', '_'),
                message
            });
        }
    }

    _validateSort(req, res, next) {
        try {
            if (!req.query['sort']) {
                return next();
            }
            const allFields = req.query['sort'].split(' ').filter((field) => this.model.rawAttributes.includes(field));
            if (allFields.length > ROUTER_MODEL_SORT_TOTAL) {
                throw new Error('Sort exceeded');
            }
            if (!req.filterQuery['order']) {
                req.filterQuery['order'] = [];
            }
            for (const field of allFields) {
                const order = allFields[field].split('-').length === 0 ? 'ASC' : 'DESC';
                req.filterQuery['order'].push([field, order]);
            }
            return next();
        } catch(error) {
            let message = error;
            if (error && error.message) {
                this.logger.error(`Class ModelRouter. Error in _validatePagination - ${error}`);
                message = error.message;
            }
            return res.status(400).json({
                code: error.toLowerCase().replaceAll(' ', '_'),
                message
            });
        }
    }
}

module.exports = SequelizeRouter;
