'use strict';

import React, { Component } from 'react';

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <div class="mainHeader">
        <h1>Je suis le header</h1>
    </div>
  }
}

export default Header;
