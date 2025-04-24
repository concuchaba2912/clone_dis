// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          <PrivateRoute path="/channels/:serverId?/:channelId?" component={Dashboard} />
          <Redirect from="/" to="/channels" />
        </Switch>
      </AuthProvider>
    </Router>
  );
};

export default App;