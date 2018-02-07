import React, { Component } from 'react'
import { connect } from 'react-redux'
import { injectIntl, intlShape } from 'react-intl'
import Activity from 'rmw-shell/lib/containers/Activity'
import { List, ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import { withFirebase } from 'firekit-provider'
import { withRouter } from 'react-router-dom'
import ReactList from 'react-list'
import Avatar from 'material-ui/Avatar'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import FontIcon from 'material-ui/FontIcon'
import muiThemeable from 'material-ui/styles/muiThemeable'
import isGranted from 'rmw-shell/lib/utils/auth'
import PropTypes from 'prop-types'
import Scrollbar from 'rmw-shell/lib/components/Scrollbar'
import SearchField from 'rmw-shell/lib/components/SearchField'
import { filterSelectors, filterActions } from 'material-ui-filter'
import { getList } from 'firekit'

const path = `workflows`

class Workflows extends Component {

  componentDidMount() {
    const { watchList, setSearch } = this.props
    setSearch('workflows', '')
    watchList(path)
  }

  renderItem = (i, k) => {
    const { list, history, muiTheme } = this.props

    const key = list[i].key
    const val = list[i].val

    const styles = {
      secondaryText: {
        fontSize: 14,
        lineHeight: '16px',
        height: 16,
        margin: 0,
        marginTop: 1,
        color: muiTheme.listItem.secondaryTextColor,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      primaryText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    }

    return <div key={key}>
      <ListItem
        onClick={() => history.push(`/${path}/edit/${key}/data`)}
        key={key}
        id={key}
        innerDivStyle={{ padding: 0.5 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'strech' }}>
          <div style={{ alignSelf: 'center', marginLeft: 15 }}>
            <Avatar
              alt="person"
              src={val.photoURL}
              icon={<FontIcon className="material-icons" color={'red'}>linear_scale</FontIcon>}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: 20, width: 150 }}>
            <div style={styles.primaryText}>
              {val.name}
            </div>
            <div style={styles.secondaryText}>
              {val.vehicle ? val.vehicle.label : undefined}
            </div>
          </div>
        </div>

      </ListItem>
      <Divider inset={true} />
    </div>
  }

  render() {
    const {
        intl,
      list,
      history,
      isGranted,
      setSearch
      } = this.props


    return (
      <Activity
        iconStyleRight={{ width: '100%', textAlign: 'center', marginLeft: 0 }}
        iconElementRight={
          <div style={{ display: 'flex' }}>
            <div style={{ width: 'calc(100% - 84px)' }}>
              <SearchField
                onChange={(e, newVal) => {
                  setSearch('workflows', newVal)
                }}
                hintText={intl.formatMessage({ id: 'search' })}
              />
            </div>
          </div>
        }
        isLoading={list === undefined}>

        <div style={{ height: '100%' }}>
          <Scrollbar>
            <List ref={field => this.list = field}>
              <ReactList
                itemRenderer={this.renderItem}
                length={list ? list.length : 0}
                type='simple'
              />
            </List>
          </Scrollbar>
          <div
            style={{ float: "left", clear: "both" }}
          />
          {
            isGranted('create_workflow') &&
            <FloatingActionButton
              onClick={() => { history.push(`/${path}/create`) }}
              style={{ position: 'fixed', bottom: 15, right: 20, zIndex: 99 }}
              secondary={true}>
              <FontIcon className="material-icons" >add</FontIcon>
            </FloatingActionButton>
          }
        </div>
      </Activity>
    )
  }
}

Workflows.propTypes = {
  intl: intlShape.isRequired,
  isGranted: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
  const { filters } = state

  return {
    list: filterSelectors.getFilteredList(
      path,
      filters,
      getList(state, path),
      fieldValue => fieldValue.val
    ),
    isGranted: grant => isGranted(state, grant)
  }
}


export default connect(
  mapStateToProps, { ...filterActions }
)(injectIntl(withFirebase(withRouter(muiThemeable()(Workflows)))))