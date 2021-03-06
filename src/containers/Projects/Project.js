import Activity from 'rmw-shell/lib/containers/Activity'
import Dialog from 'material-ui/Dialog'
import FireForm from 'fireform';
import FlatButton from 'material-ui/FlatButton'
import FontIcon from 'material-ui/FontIcon'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import SearchField from 'rmw-shell/lib/components/SearchField'
import ProjectForm from '../../components/Forms/ProjectForm'
import isGranted from 'rmw-shell/lib/utils/auth'
import muiThemeable from 'material-ui/styles/muiThemeable'
import { ResponsiveMenu } from 'material-ui-responsive-menu'
import { Tabs, Tab } from 'material-ui/Tabs'
import { change, submit, formValueSelector } from 'redux-form'
import { connect } from 'react-redux'
import { filterActions } from 'material-ui-filter'
import { injectIntl, intlShape } from 'react-intl'
import { setSimpleValue } from 'rmw-shell/lib/store/simpleValues/actions'
import { withFirebase } from 'firekit-provider'
import { withRouter } from 'react-router-dom'
import UsersToggle from '../UsersToggle/UsersToggle'
import { getList, getPath } from 'firekit'

const path = 'projects'
const form_name = 'project'

class Project extends Component {

    validate = (values) => {
        const { intl, companies, uid } = this.props
        const errors = {}

        let nameDuplicate = false
        if (companies) {
            companies.forEach(company => {
                if (company.key !== uid && ((company.val.subcontractor !== true) === (values.subcontractor !== true)) && (company.val.name === values.name)) {
                    nameDuplicate = true
                }
            })
        }


        errors.name = !values.name ? intl.formatMessage({ id: 'error_required_field' }) : ''
        errors.name = nameDuplicate ? intl.formatMessage({ id: 'error_name_exists' }) : errors.name
        errors.full_name = !values.full_name ? intl.formatMessage({ id: 'error_required_field' }) : ''
        errors.vat = !values.vat ? intl.formatMessage({ id: 'error_required_field' }) : ''

        return errors
    }

    componentDidMount() {
        const { watchList, watchPath, uid, setSearch } = this.props
        setSearch('users_toggle', '')
        watchPath(`projects/${uid}`)
        watchList(`project_users/${uid}`)
        watchList(`project_steps/${uid}`)
        watchList(path)
    }

    handleClose = () => {
        const { setSimpleValue } = this.props
        setSimpleValue('delete_project', false)
    }

    handleDelete = () => {
        const { history, match, firebaseApp, auth } = this.props
        const uid = match.params.uid

        if (uid) {
            firebaseApp.database().ref().child(`/${path}/${uid}`).remove().then(() => {
                firebaseApp.database().ref(`user_projects/${auth.uid}/${uid}`).remove().then(() => {
                    this.handleClose()
                    history.goBack()
                })
            })
        }
    }

    handlePhotoUploadSuccess = (snapshot) => {
        const { setSimpleValue, change } = this.props
        change(form_name, 'photoURL', snapshot.downloadURL)
        setSimpleValue('new_company_photo', undefined)
    }

    handleTabActive = (value) => {
        const { history, uid } = this.props
        history.replace(`/${path}/edit/${uid}/${value}`)
    }

    getToggledValue = (userUid) => {
        const { projectUsers } = this.props

        let result = false

        projectUsers.forEach(user => {

            if (user.key === userUid) {
                result = true
            }
        });

        return result

    }

    handleUserToggle = (userUid, toggled) => {
        const { firebaseApp, uid } = this.props

        if (toggled) {
            firebaseApp.database().ref(`user_projects/${userUid}/${uid}`).set(true)
            firebaseApp.database().ref(`project_users/${uid}/${userUid}`).set(true)
        } else {
            firebaseApp.database().ref(`user_projects/${userUid}/${uid}`).remove()
            firebaseApp.database().ref(`project_users/${uid}/${userUid}`).remove()
        }


    }

    render() {
        const {
            history,
            intl,
            setSimpleValue,
            match,
            submit,
            muiTheme,
            isGranted,
            delete_project,
            editType,
            uid,
            setSearch,
            firebaseApp,
            getFormValue
        } = this.props


        const actions = [
            <FlatButton
                label={intl.formatMessage({ id: 'cancel' })}
                primary={true}
                onClick={this.handleClose}
            />,
            <FlatButton
                label={intl.formatMessage({ id: 'delete' })}
                secondary={true}
                onClick={this.handleDelete}
            />,
        ]

        const menuList = [
            {
                hidden: (uid === undefined && !isGranted(`create_${form_name}`)) || (uid !== undefined && !isGranted(`edit_${form_name}`)),
                text: intl.formatMessage({ id: 'save' }),
                icon: <FontIcon className="material-icons" color={muiTheme.palette.canvasColor}>save</FontIcon>,
                tooltip: intl.formatMessage({ id: 'save' }),
                onClick: () => { submit('project') }
            },
            {
                hidden: uid === undefined || !isGranted(`delete_${form_name}`),
                text: intl.formatMessage({ id: 'delete' }),
                icon: <FontIcon className="material-icons" color={muiTheme.palette.canvasColor}>delete</FontIcon>,
                tooltip: intl.formatMessage({ id: 'delete' }),
                onClick: () => { setSimpleValue('delete_project', true) }
            }
        ]

        return (
            <Activity
                iconStyleRight={editType === 'users' ? { width: '100%', textAlign: 'center', marginLeft: 0 } : {}}
                iconElementRight={
                    <div style={{ display: 'flex' }}>
                        {
                            editType === 'users' &&
                            <div style={{ width: 'calc(100% - 84px)' }}>
                                <SearchField
                                    onChange={(e, newVal) => {
                                        setSearch('users_toggle', newVal)
                                    }}
                                    hintText={`${intl.formatMessage({ id: 'user_label' })} ${intl.formatMessage({ id: 'search' })}`}
                                />
                            </div>
                        }
                        <div style={{ position: 'absolute', right: 10, width: '12%' }}>
                            <ResponsiveMenu
                                iconMenuColor={muiTheme.palette.canvasColor}
                                menuList={menuList}
                            />
                        </div>
                    </div>
                }
                onBackClick={() => history.goBack()}
                title={editType === 'users' ? undefined : intl.formatMessage({ id: match.params.uid ? 'edit_project' : 'create_project' })}>

                <Tabs
                    value={editType}
                    onChange={this.handleTabActive}>
                    <Tab
                        value={'data'}
                        icon={<FontIcon className="material-icons">local_activity</FontIcon>}>
                        {
                            editType === 'data' &&
                            <div style={{ margin: 15, display: 'flex' }}>
                                <FireForm
                                    firebaseApp={firebaseApp}
                                    getFormValue={getFormValue}
                                    name={form_name}
                                    path={`/${path}/`}
                                    validate={this.validate}
                                    onSubmitSuccess={() => history.goBack()}
                                    onDelete={() => history.goBack()}
                                    uid={match.params.uid}>
                                    <ProjectForm
                                        handleContactSelected={this.handleContactSelected}
                                        handlePhotoUploadSuccess={this.handlePhotoUploadSuccess}
                                    />
                                </FireForm>
                            </div>
                        }
                    </Tab>
                    {uid &&
                        <Tab
                            value={'users'}
                            icon={<FontIcon className="material-icons">group</FontIcon>}>
                            {
                                editType === 'users' &&
                                <UsersToggle
                                    {...this.props}
                                    getValue={this.getToggledValue}
                                    onToggle={this.handleUserToggle}
                                />
                            }
                        </Tab>
                    }
                </Tabs>

                <Dialog
                    title={intl.formatMessage({ id: 'delete_project_title' })}
                    actions={actions}
                    modal={false}
                    open={delete_project === true}
                    onRequestClose={this.handleClose}>
                    {intl.formatMessage({ id: 'delete_project_message' })}
                </Dialog>
            </Activity>
        )
    }
}

Project.propTypes = {
    history: PropTypes.object,
    intl: intlShape.isRequired,
    match: PropTypes.object.isRequired,
    submit: PropTypes.func.isRequired,
    muiTheme: PropTypes.object.isRequired,
    isGranted: PropTypes.func.isRequired,
}


const getFormValue = formValueSelector('project')

const mapStateToProps = (state, ownProps) => {
    const { intl, simpleValues, auth } = state
    const { match } = ownProps

    const uid = match.params.uid
    const editType = match.params.editType ? match.params.editType : 'data'
    const delete_project = simpleValues.delete_project

    const values = getPath(state, `projects/${uid}`) ? getPath(state, `projects/${uid}`) : {}
    const stepIndex = values.stepIndex !== undefined ? values.stepIndex : 0

    const projectWorkflow = getFormValue(state, 'workflow')
    const projectSteps = projectWorkflow ? (projectWorkflow.steps ? projectWorkflow.steps : []) : []

    return {
        auth,
        uid,
        editType,
        delete_project,
        projectWorkflow,
        getFormValue: (field) => getFormValue(state, field),
        projectUsers: getList(state, `project_users/${uid}`),
        projectSteps,
        intl,
        stepIndex,
        isGranted: grant => isGranted(state, grant)
    }
}

export default connect(
    mapStateToProps, { setSimpleValue, change, submit, ...filterActions }
)(injectIntl(withRouter(withFirebase(muiThemeable()(Project)))))
