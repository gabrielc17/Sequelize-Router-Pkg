'use strict';

const SequelizeRouter = require('./sequelize-router');
const pluralize = require('pluralize');

module.exports = class BuildRouter extends SequelizeRouter {
    constructor(_model, _controller, _router, _logger) {
        super(
            _model,
            _controller,
            _router,
            _logger
        );
    }

    _findAll() {
        return (req, res) => {
            return this.model.findAll(req.filterQuery)
                .then((result) => {
                    return res.status(200).json({result});
                })
                .catch((error) => {
                    this.logger.error(`Class BuildRouter. Error in findAll - ${error.message}`);
                    return res.status(500).json({
                        code: 'internal_error',
                        message: 'Internal Error'
                    });
                });
        };
    }

    _findById() {
        return (req, res) => {
            return this.model.findByPk(req.params.id)
                .then((result) => {
                    return res.status(200).json(result);
                })
                .catch((error) => {
                    this.logger.error(`Class BuildRouter. Error in findAll - ${error.message}`);
                    return res.status(500).json({
                        code: 'internal_error',
                        message: 'Internal Error'
                    });
                });
        };
    }

    _build() {
        const urlPath = `/api/${pluralize.plural(this.model.name.toLowerCase())}`;
        const router = this.router;
        const middlewares = {
            get: [this._findAll()],
            getById: [this._findById()]
        };
        const controllers = this.controller;
        if (controllers && controllers !== null) {
            for (const method of Object.keys(controllers)) {
                const listMiddle = controllers[method]();
                middlewares[method].unshift(listMiddle);
            }
        }
        router.get(
            urlPath,
            super._filterQuery,
            super._validatePagination,
            super._validateSort,
            middlewares['get']
        );
        router.get(
            urlPath + '/:id',
            middlewares['getById'],
            
        );
        return router;
    }
};
