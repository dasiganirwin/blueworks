const svc = require('../services/auth.service');

const register      = async (req, res, next) => { try { res.status(201).json(await svc.register(req.body));                                 } catch (e) { next(e); } };
const sendOTP       = async (req, res, next) => { try { res.json(await svc.sendOTP(req.body.phone));                                         } catch (e) { next(e); } };
const verifyOTP     = async (req, res, next) => { try { res.json(await svc.verifyOTPCode(req.body.phone, req.body.otp));                      } catch (e) { next(e); } };
const login         = async (req, res, next) => { try { res.json(await svc.login(req.body));                                                  } catch (e) { next(e); } };
const refreshToken  = async (req, res, next) => { try { res.json(await svc.refreshToken(req.body.refresh_token));                             } catch (e) { next(e); } };
const forgotPassword= async (req, res, next) => { try { await svc.forgotPassword(req.body.email); res.json({ message: 'Reset link sent if account exists.' }); } catch (e) { next(e); } };
const resetPassword = async (req, res, next) => { try { await svc.resetPassword(req.body); res.json({ message: 'Password updated successfully.' });            } catch (e) { next(e); } };
const logout        = async (req, res, next) => { try { const token = req.headers.authorization?.split(' ')[1]; await svc.logout(token); res.sendStatus(204); } catch (e) { next(e); } };
const logoutAll     = async (req, res, next) => { try { await svc.logoutAll(req.user.sub); res.sendStatus(204); } catch (e) { next(e); } };

module.exports = { register, sendOTP, verifyOTP, login, refreshToken, forgotPassword, resetPassword, logout, logoutAll };
