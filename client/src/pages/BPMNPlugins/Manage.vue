<template>
    <div>
      <Row>
        <Col>
          <Collapse v-model="value1">
            <Panel name='1'>
                Add
                <div slot='content'>
                    <Form :model="fileJson" ref="fileJson" :rules="ruleValidate" inline>
                        <FormItem label="Title" prop="title" style="width: 25%">
                            <Input type="text" v-model.trim="fileJson.title">
                            </Input>
                        </FormItem>
                        <FormItem label="PluginType" prop="pluginType" style="width: 25%">
                            <Input type="text" v-model.trim="fileJson.pluginType">
                            </Input>
                        </FormItem>
                        <FormItem label="Image" prop="image" style="width: 25%">
                            <Input type="text" v-model.trim="fileJson.image">
                            </Input>
                        </FormItem>
                        <FormItem>
                            <Button type="primary" size="small" @click="handleSubmit('fileJson')" style="margin-top: 43px; float: right;" :loading="loading">Save</Button>
                        </FormItem>
                    </Form>
                </div>
            </Panel>
        </Collapse>
          <Table size='small' :loading='logingPluginList' style="margin-top: 10px;" border ref='selection' :columns='columns' :data='plugins' stripe></Table>
        </Col>
      </Row>
    </div>
</template>
<script>
import ModelBpmnplugin from '@/api/bpmnplugins'
import moment from 'moment'
import _ from 'lodash'
// import axios from 'axios'
// import FormData from 'form-data'
// import config from '@/config'
export default {
  data () {
    return {
      value1: '',
      ruleValidate: {
        title: [
          {
            required: true,
            message: 'Please enter your Plugin title',
            trigger: 'blur'
          }
        ],
        pluginType: [
          {
            required: true,
            message: 'Please enter Plugin type',
            trigger: 'blur'
          }
        ],
        image: [
          {
            required: true,
            message: 'Please select image',
            trigger: 'blur'
          }
        ]
      },
      logingPluginList: true,
      loadingFormPlugin: false,
      fileJson: {
        title: '',
        image:
          'https://cdn.instructables.com/FL2/5KAS/I7MXEMQ0/FL25KASI7MXEMQ0.LARGE.jpg',
        pluginType: '',
        type: '',
        isEnable: true
      },
      formPlugin: {
        type: 'url',
        url: {
          link: ''
        },
        file: {
          name: ''
        }
      },
      columns: [
        {
          title: ' ',
          key: 'imgurl',
          align: 'center',
          width: 60,
          render: (h, params) => {
            return h('Avatar', {
              props: {
                shape: 'square',
                size: 'small',
                src: params.row.image
              },
              style: {
                backgroundColor: 'transparent'
              }
            })
          }
        },
        {
          title: 'Title',
          key: 'title',
          sortable: true
        },
        {
          title: 'pluginType',
          key: 'pluginType',
          sortable: true,
          width: 200
        },
        {
          title: 'createdOn',
          key: 'createdOn',
          sortable: true,
          width: 200,
          sortType: 'desc',
          render: (h, params) => {
            return h('div', moment(params.row.createdOn).format('lll'))
          }
        },
        {
          title: 'isEnable',
          key: 'isEnable',
          width: 100,
          align: 'center',
          render: (h, params) => {
            return h('i-switch', {
              props: {
                value: params.row.isEnable,
                size: 'small'
              },
              on: {
                'on-change': value => {
                  params.row.isEnable = value
                  this.$Modal.confirm({
                    title: 'Confirm',
                    content:
                      '<p>Are you sure you want to ' +
                      (value ? 'enable' : 'disable') +
                      ' this plugin?</p>',
                    onOk: async () => {
                      await this.handleEnableDisable(
                        this.plugins[params.index]
                      )
                    },
                    onCancel: () => {
                      params.row.isEnable = !value
                    }
                  })
                }
              }
            })
          }
        },
        {
          title: 'Action',
          key: 'action',
          width: 150,
          align: 'center',
          render: (h, params) => {
            return h('div', [
              h(
                'Button',
                {
                  props: {
                    type: 'primary',
                    size: 'small'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.$Modal.confirm({
                        title: 'Confirm',
                        loading: true,
                        content:
                          '<p>Are you sure you want to <b> uninstall </b> this plugin?</p>',
                        onOk: async () => {
                          var response = await this.handleUninstall(
                            params.row.id
                          )
                          if (response.status === 'success') {
                            this.$Message.success('Uninstall successfull.')
                          } else {
                            this.$Message.error(response.message)
                          }
                          this.$Modal.remove()
                        }
                      })
                    }
                  }
                },
                'Uninstall'
              )
            ])
          }
        }
      ],
      plugins: []
    }
  },
  created () {
    this.init()
  },
  feathers: {
    bpmnplugins: {
      updated (data) {
        let $index = _.findIndex(this.plugins, o => {
          return o.id === data.id
        })
        this.plugins.splice($index, 1, data)
      },
      created (data) {
        // this.plugins.splice(0, 1, data)
        this.plugins.push(data)
      },
      removed (data) {
        let $index = _.findIndex(this.plugins, o => {
          return o.id === data.id
        })
        this.plugins.splice($index, 1)
      }
    }
  },
  methods: {
    init () {
      let self = this
      ModelBpmnplugin.get()
        .then(response => {
          self.plugins = response
          self.logingPluginList = false
        })
        .catch(error => {
          this.$Notice.error({
            title: error,
            desc: 'connection to the server timed out',
            duration: 0
          })
        })
    },
    async handleEnableDisable (data) {
      return await ModelBpmnplugin.update(data.id, data)
        .then(response => {
          return { status: 'success' }
        })
        .catch(error => {
          return { status: 'error', message: error }
        })
    },
    handleTypeChange (name) {
      // if (this.$refs[name] && this.formPlugin.type === 'file') {
      //   // this.$refs['formPlugin'].fields.map(function (value, key) {
      //   //   if (value.validateState === 'error') {
      //   //     value.validate()
      //   //   }
      //   // })
      //   // validateStatus
      //   this.$refs[name].resetFields()
      // }
    },
    handleFileChange (e) {
      let self = this
      var files = e.target.files || e.dataTransfer.files
      if (files.length > 0) {
        this.formPlugin.file.name = files[0].name
        var reader = new FileReader()
        reader.onload = e => {
          self.fileJson = JSON.parse(e.target.result)
        }
        reader.readAsText(e.target.files[0])
      }
    },
    handleSubmit (name) {
      this.loadingFormPlugin = true
      this.$refs[name].validate((valid) => {
        if (valid) {
          ModelBpmnplugin.create(this.fileJson)
            .then(response => {
              this.$Message.success('Plugin install successfully!')
              this.loadingFormPlugin = false
              this.$refs[name].resetFields()
              this.formPlugin.type = 'url'
              this.value1 = ''
            })
            .catch(error => {
              this.$Notice.error({
                title: 'Request failed',
                desc: error
              })
              this.loadingFormPlugin = false
            })
        }
      })
    },
    async handleUninstall (id) {
      return await ModelBpmnplugin.delete(id)
        .then(response => {
          return { status: 'success' }
        })
        .catch(error => {
          return { status: 'error', message: error }
        })
    },
    handleReset (name) {
      this.$refs[name].resetFields()
      this.formPlugin.type = 'url'
    }
  }
}
</script>