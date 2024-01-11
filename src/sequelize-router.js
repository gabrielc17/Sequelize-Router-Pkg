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

    _filterQuery() {
        return (req, res, next) => {
            const validQueries = ['limit', 'skip', 'sort', 'conditions'];
            req.filterQuery = {};
            for (const field of validQueries) {
                if (!req.query[field]) {
                    delete req.query[field];
                }
            }
            return next();
        }
    }
    
    _validatePagination() {
        return (req, res, next) => {
            try {
                const validateValue = (value, type) => {
                    if (isNaN(value)) {
                        throw new Error(`Invalid ${type}`);
                    }
                    if (value < 0) {
                        throw new Error(`Invalid value_${type}`);
                    }
                    return true;
                }
    
                req.query['limit'] = !req.query['limit'] ? ROUTER_MODEL_LIMIT : parseInt(req.query['limit']);
                req.query['skip'] = !req.query['skip'] ? 0 : parseInt(req.query['skip']);
    
                for (const field of ['limit', 'skip']) {
                    validateValue(req.query[field], field);
                }
                if (req.query['limit'] > ROUTER_MODEL_LIMIT) {
                    throw new Error('Limit exceeded');
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
    }

    _validateSort() {
        return (req, res, next) => {
            try {
                if (!req.query['sort']) {
                    return next();
                }
                const modelFields = Object.keys(this.model.rawAttributes);
                const allFields = req.query['sort'].split(' ').filter((field) => modelFields.includes(field));
                if (allFields.length > ROUTER_MODEL_SORT_TOTAL) {
                    throw new Error('Sort exceeded');
                }
                if (!req.filterQuery['order']) {
                    req.filterQuery['order'] = [];
                }
                for (const field of allFields) {
                    const order = field.split('-').length === 0 ? 'ASC' : 'DESC';
                    req.filterQuery['order'].push([field, order]);
                }
                return next();
            } catch(error) {
                let message = error;
                if (error && error.message) {
                    this.logger.error(`Class ModelRouter. Error in _validateSort - ${error}`);
                    message = error.message;
                }
                return res.status(400).json({
                    code: error.toLowerCase().replaceAll(' ', '_'),
                    message
                });
            }
        }
    }

}

module.exports = SequelizeRouter;
