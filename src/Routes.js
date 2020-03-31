import React from "react";
import { Route, Switch } from "react-router-dom";
import AppliedRoute from "./components/AppliedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import Home from "./containers/Home";
import Category from "./containers/Category";
import Item from "./containers/Item";
import Items from "./containers/Items";
import Signup from "./containers/Signup";
import NewCategory from "./containers/NewCategory";
import NewItem from "./containers/NewItem";
import NotFound from "./containers/NotFound";

export default function Routes({ appProps }) {
  return (
    <Switch>
      <AppliedRoute path="/" exact component={Home} appProps={appProps} />
      <AuthenticatedRoute path="/signup" exact component={Signup} appProps={appProps} />
      <AuthenticatedRoute path="/categories/new/:configId" exact component={NewCategory} appProps={appProps} />
      <AuthenticatedRoute path="/categories/:id" exact component={Category} appProps={appProps} />
      <AuthenticatedRoute path="/items/new/:configId/:categoryId" exact component={NewItem} appProps={appProps} />
      <AuthenticatedRoute path="/items/:id" exact component={Item} appProps={appProps} />
      {appProps.clientConfig.map(pageConfig => (
        <AuthenticatedRoute path={`/${pageConfig.itemType.replace(/ /g, '_')}s`} exact component={Items} appProps={appProps} key={pageConfig.id} />
      ))}
      {/* Finally, catch all unmatched routes */}
      <Route component={NotFound} />
    </Switch>
  );
}
