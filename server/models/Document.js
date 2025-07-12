const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
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
  file: {
    originalName: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  },
  content: {
    raw: {
      type: String,
      default: ''
    },
    processed: {
      type: String,
      default: ''
    },
    keywords: [{
      word: String,
      weight: Number,
      frequency: Number
    }],
    entities: [{
      text: String,
      type: String,
      confidence: Number
    }],
    summary: {
      type: String,
      default: ''
    }
  },
  processing: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    error: {
      type: String,
      default: ''
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  knowledgeGraph: {
    nodes: [{
      id: String,
      label: String,
      type: String,
      properties: mongoose.Schema.Types.Mixed
    }],
    edges: [{
      from: String,
      to: String,
      label: String,
      weight: Number,
      properties: mongoose.Schema.Types.Mixed
    }]
  },
  vectors: {
    embeddings: [{
      segment: String,
      vector: [Number],
      index: Number
    }],
    vectorDbId: {
      type: String,
      default: ''
    }
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
    professor: {
      type: String,
      default: ''
    },
    academicYear: {
      type: String,
      default: ''
    },
    semester: {
      type: String,
      default: ''
    },
    tags: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
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
    downloads: {
      type: Number,
      default: 0
    },
    questionsGenerated: {
      type: Number,
      default: 0
    },
    knowledgeGraphViews: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 索引优化
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ 'metadata.tags': 1 });
documentSchema.index({ 'metadata.subject': 1 });
documentSchema.index({ 'processing.status': 1 });
documentSchema.index({ 'sharing.isPublic': 1 });

// 虚拟字段
documentSchema.virtual('isProcessed').get(function() {
  return this.processing.status === 'completed';
});

documentSchema.virtual('hasKnowledgeGraph').get(function() {
  return this.knowledgeGraph.nodes.length > 0;
});

// 方法
documentSchema.methods.updateProcessingStatus = function(status, progress = null, error = null) {
  this.processing.status = status;
  if (progress !== null) this.processing.progress = progress;
  if (error) this.processing.error = error;
  
  if (status === 'processing' && !this.processing.startedAt) {
    this.processing.startedAt = new Date();
  }
  
  if (status === 'completed' || status === 'failed') {
    this.processing.completedAt = new Date();
  }
  
  return this.save();
};

documentSchema.methods.addView = function() {
  this.analytics.views += 1;
  return this.save();
};

documentSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    metadata: this.metadata,
    analytics: this.analytics,
    isProcessed: this.isProcessed,
    hasKnowledgeGraph: this.hasKnowledgeGraph,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Document', documentSchema); 