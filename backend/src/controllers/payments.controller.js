const svc = require('../services/payments.service');

const initiatePayment = async (req, res, next) => { try { res.status(201).json(await svc.initiatePayment(req.user.sub, req.user.role, req.body)); } catch (e) { next(e); } };
const getPayment      = async (req, res, next) => { try { res.json(await svc.getPayment(req.params.id, req.user.sub, req.user.role));               } catch (e) { next(e); } };
const cashConfirm     = async (req, res, next) => { try { res.json(await svc.cashConfirm(req.params.id, req.user.sub));                            } catch (e) { next(e); } };
const refund          = async (req, res, next) => { try { res.json(await svc.refund(req.params.id, req.user.sub, req.body));                        } catch (e) { next(e); } };

const handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    await svc.handleWebhook(req.body, sig);
    res.json({ received: true });
  } catch (e) { next(e); }
};

module.exports = { initiatePayment, getPayment, cashConfirm, refund, handleWebhook };
