const mongoose = require('mongoose');

const knowledgeGraphSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  graph: {
    nodes: [{
      id: {
        type: String,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['concept', 'topic', 'definition', 'example', 'theory', 'formula', 'person', 'place', 'event'],
        default: 'concept'
      },
      properties: {
        description: String,
        importance: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.5
        },
        frequency: {
          type: Number,
          default: 1
        },
        sourceDocuments: [String],
        synonyms: [String],
        category: String,
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          default: 'medium'
        }
      },
      position: {
        x: Number,
        y: Number
      },
      style: {
        color: String,
        size: Number,
        shape: String
      }
    }],
    edges: [{
      id: {
        type: String,
        required: true
      },
      from: {
        type: String,
        required: true
      },
      to: {
        type: String,
        required: true
      },
      label: {
        type: String,
        default: ''
      },
      type: {
        type: String,
        enum: ['related_to', 'part_of', 'depends_on', 'similar_to', 'opposite_to', 'example_of', 'leads_to'],
        default: 'related_to'
      },
      weight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      },
      properties: {
        strength: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.5
        },
        sourceDocuments: [String],
        evidence: String,
        bidirectional: {
          type: Boolean,
          default: false
        }
      },
      style: {
        color: String,
        width: Number,
        dashes: Boolean
      }
    }]
  },
  metadata: {
    subject: {
      type: String,
      default: ''
    },
    course: {
      type: String,
      default: ''
    },
    chapter: {
      type: String,
      default: ''
    },
    tags: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    version: {
      type: Number,
      default: 1
    }
  },
  statistics: {
    nodeCount: {
      type: Number,
      default: 0
    },
    edgeCount: {
      type: Number,
      default: 0
    },
    density: {
      type: Number,
      default: 0
    },
    averageDegree: {
      type: Number,
      default: 0
    },
    clusteringCoefficient: {
      type: Number,
      default: 0
    }
  },
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      }
    }]
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    interactions: {
      type: Number,
      default: 0
    },
    queries: {
      type: Number,
      default: 0
    },
    exports: {
      type: Number,
      default: 0
    }
  },
  generation: {
    algorithm: {
      type: String,
      default: 'nlp_based'
    },
    parameters: mongoose.Schema.Types.Mixed,
    processingTime: {
      type: Number,
      default: 0
    },
    aiModel: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// 索引优化
knowledgeGraphSchema.index({ userId: 1, createdAt: -1 });
knowledgeGraphSchema.index({ 'metadata.tags': 1 });
knowledgeGraphSchema.index({ 'metadata.subject': 1 });
knowledgeGraphSchema.index({ 'sharing.isPublic': 1 });
knowledgeGraphSchema.index({ documentIds: 1 });

// 虚拟字段
knowledgeGraphSchema.virtual('complexity').get(function() {
  const nodeCount = this.statistics.nodeCount;
  const edgeCount = this.statistics.edgeCount;
  
  if (nodeCount < 10) return 'simple';
  if (nodeCount < 50) return 'moderate';
  if (nodeCount < 100) return 'complex';
  return 'very_complex';
});

// 方法
knowledgeGraphSchema.methods.updateStatistics = function() {
  this.statistics.nodeCount = this.graph.nodes.length;
  this.statistics.edgeCount = this.graph.edges.length;
  
  // 计算图密度
  const n = this.statistics.nodeCount;
  if (n > 1) {
    const maxEdges = n * (n - 1) / 2;
    this.statistics.density = this.statistics.edgeCount / maxEdges;
  }
  
  // 计算平均度数
  if (n > 0) {
    this.statistics.averageDegree = (2 * this.statistics.edgeCount) / n;
  }
  
  return this.save();
};

knowledgeGraphSchema.methods.addView = function() {
  this.analytics.views += 1;
  return this.save();
};

knowledgeGraphSchema.methods.addInteraction = function() {
  this.analytics.interactions += 1;
  return this.save();
};

knowledgeGraphSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    metadata: this.metadata,
    statistics: this.statistics,
    analytics: this.analytics,
    complexity: this.complexity,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// 静态方法
knowledgeGraphSchema.statics.findBySubject = function(subject) {
  return this.find({ 'metadata.subject': subject, 'sharing.isPublic': true });
};

knowledgeGraphSchema.statics.findPopular = function(limit = 10) {
  return this.find({ 'sharing.isPublic': true })
    .sort({ 'analytics.views': -1 })
    .limit(limit);
};

module.exports = mongoose.model('KnowledgeGraph', knowledgeGraphSchema); 